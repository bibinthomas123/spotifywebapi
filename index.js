const express = require("express");
const request = require("request");
const morgan = require("morgan");
const { writeInFile } = require("./file");

require("dotenv").config();

const app = express();
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello World");
});

const SPOTIFY_CLIENT = process.env.SPOTIFY_CLIENT_ID; // Your Spotify Client ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET; // Your Spotify Client Secret
const scope =
  "user-read-private user-read-email playlist-read-private playlist-read-collaborative ";
const redirect_uri = "http://localhost:3000/callback";
const clientId = SPOTIFY_CLIENT;
const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirect_uri}`;

app.get("/login", (req, res) => {
  res.redirect(authorizationUrl);
});

app.get("/callback", (req, res) => {
  const { code } = req.query;
  const redirect_uri = "http://localhost:3000/callback";
  const clientId = SPOTIFY_CLIENT;
  const clientSecret = SPOTIFY_CLIENT_SECRET;
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
    json: true,
  };
  request.post(authOptions, (error, response, body) => {
    const { access_token, refresh_token } = body;

    res.redirect(`/playlist?access_token=${access_token}`);
  });
});

app.get("/playlist", (req, res) => {
  const { access_token } = req.query;
  const options = {
    url: "https://api.spotify.com/v1/me/playlists",
    headers: { Authorization: `Bearer ${access_token}` },
    json: true,
  };
  request.get(options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const playlists = body.items;
      let discoverWeekly = null;

      playlists.forEach((playlist) => {
        if (playlist.name === "Discover Weekly" || playlist.name === "spotifydiscover") {
          discoverWeekly = playlist;
        }
      });

      if (discoverWeekly !== null) {
        // Use the playlist ID to access the tracks in the playlist
        const playlistId = discoverWeekly.id;
        const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}`;
        request.get(
          {
            url: playlistUrl,
            headers: { Authorization: `Bearer ${access_token}` },
            json: true,
          },
          (error, response, body) => {
            if (!error && response.statusCode === 200) {
              writeInFile(body, "success");
              res.json(body);
            } else {
              writeInFile(error, "error");
              res.status(response.statusCode).json({ error });
            }
          }
        );
      } else {
        res.status(404).json({ error: "Discover Weekly playlist not found" });
      }
    } else {
      writeInFile(error, "error");
      res.status(response.statusCode).json({ error });
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
