const https = require("node:https");
const fs = require("node:fs");

module.exports = class AccessTokenManager {
  constructor() {}

  accessTokenCached() {
    return fs.existsSync("access-token");
  }

  readCachedAccessToken() {
    const [token, expirationDateString] = fs.readFileSync("access-token", "utf8").split("\n");
    return [token, new Date(expirationDateString)];
  }

  readClientIdAndSecret() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error(
        "Missing CLIENT_ID or CLIENT_SECRET environment variables. Exiting...",
      );
      process.exit(1);
    }

    return [clientId, clientSecret];
  }

  readAccessTokenFromHttpsResponse(data) {
    const dataString = data.toString();
    const tokenRe = RegExp('"access_token":"[a-zA-Z0-9-_]*', "g");
    const accessToken = dataString.match(tokenRe)[0].slice(16);

    const expiresInRe = RegExp('"expires_in":[0-9]*', "g");
    const expiresInSeconds = parseInt(dataString.match(expiresInRe)[0].slice(13));
    const currentTime = new Date();
    const expirationDate = new Date(
      currentTime.getTime() + expiresInSeconds * 1000,
    );

    return [accessToken, expirationDate];
  }

  requestNewAccessToken() {
    const [clientId, clientSecret] = this.readClientIdAndSecret();
    const requestBody = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;

    const options = {
      hostname: "accounts.spotify.com",
      port: 443,
      path: "/api/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        res.on("data", (data) => {
          resolve(this.readAccessTokenFromHttpsResponse(data));
        });
      });
      req.on("error", (err) => reject(err));
      req.write(requestBody);
      req.end();
    });
  }

  async cacheAccessToken(token, expirationDate) {
    console.log("Caching the new access token...");
    fs.writeFile("access-token", `${token}\n${expirationDate}`, (err) => {
      if (err) console.error("Writing 'access-token' failed.");
    });
  }


  async requestAndCacheNewAccessToken() {
    console.log("Requesting a new access token...");
    const [token, expirationDate] = await this.requestNewAccessToken();
    this.cacheAccessToken(token, expirationDate);
    return token;
  }

  async get() {
    if (this.accessTokenCached()) {
      const [token, expirationDate] = this.readCachedAccessToken();
      if (new Date() < expirationDate)
        return token;
    }
    return await this.requestAndCacheNewAccessToken();
  }
}
