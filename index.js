const express = require("express");
const request = require("request");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { writeInFile } = require("./file");

const app = express();
const port = process.env.PORT || 3000;

dotenv.config();
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/callback";
const SCOPE =
  "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read playlist-modify-public playlist-modify-private";
const AUTHORIZATION_URL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${SCOPE}&redirect_uri=${REDIRECT_URI}`;

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/login", (req, res) => {
  res.redirect(AUTHORIZATION_URL);
});

app.get("/callback", async (req, res) => {
  const { code } = req.query;
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    json: true,
  };

  request.post(authOptions, (error, response, body) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!body || !body.access_token) {
      console.error(body);
      return res
        .status(500)
        .json({ error: "No access token found in response" });
    }
    const access_token = body.access_token;

    res.redirect(`/playlist?access_token=${access_token}`);
  });
});

app.get("/playlist", (req, res) => {
  const { access_token } = req.query;
  const USER_ID = process.env.SPOTIFY_ME;
  const options = {
    url: "https://api.spotify.com/v1/me/tracks",
    headers: { Authorization: `Bearer ${access_token}` },
    json: true,
  };
  request.get(options, (error, response, body) => {
    if (error) {
      // handle error
      console.error(error);
      return res.status(500).json({ error });
    }
    if (response.statusCode !== 200) {
      // handle error response
      console.error(response);
      return res.status(response.statusCode).json({ error: "API error" });
    }
    const tracks = body.items.map((item) => item.track.id);
    const options = {
      url: `https://api.spotify.com/v1/users/${USER_ID}/playlists`,
      headers: { Authorization: `Bearer ${access_token}` },
      json: true,
      body: {
        name: "My liked songs",
        description: "My liked songs",
        public: false,
      },
    };
    request.post(options, (error, response, body) => {
      if (error) {
        // handle error
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (response.statusCode !== 201) {
        // handle error response
        console.error(response);
        return res.status(response.statusCode).json({ error: "API error" });
      }
      const playlistId = body.id;
      const options = {
        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        headers: { Authorization: `Bearer ${access_token}` },
        json: true,
        body: { uris: tracks.map((track) => `spotify:track:${track}`) },
      };
      request.post(options, (error, response, body) => {
        if (error) {
          // handle error
          console.error(error);
          return res.status(500).json({ error: "Internal server error" });
        }
        if (response.statusCode !== 201) {
          // handle error response
          console.error(response);
          return res.status(response.statusCode).json({ error: "API error" });
        }
        return res.json({ success: true });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
