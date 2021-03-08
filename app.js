const express = require('express'); // Innitializing express
require('dotenv').config(); // Configuring dotenb environment
const fetch = require('node-fetch');  // To handle HTTP requests through fetch
const cookieSession = require('cookie-session');

const app = express();  // Innitializing app

app.set('view engine', 'ejs');  // Setting up ejs template engine
app.set('views', './views');  // Setting up views to be rendered from

app.use('/static', express.static('public'));  // Setting up static files to be available to the app

app.use(cookieSession({  // setting up cookie session for this app
  secret: process.env.COOKIE_SECRET
}));

const PORT = process.env.PORT || 3000;
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;


// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login/github', (req, res) => {
  const redirectURI = 'http://localhost:5000/login/github/callback';
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectURI}`);  
});

app.get('/login/github/callback', async (req, res) => {
  const code = req.query.code;
  const accessToken = await getAccessToken(code);
  const githubData = await getGithubUser(accessToken);
  // console.log({githubData});
  // res.json({githubData});

  if(githubData) {
    req.session.githubData = githubData;
    req.session.token = accessToken;
    res.redirect('/admin');
  } else {
    res.send('Something went wrong...')
  }

});

app.get('/admin', (req, res) => {
  const githubData = req.session.githubData;

  if (githubData) {
    res.render('profile', {githubData});    
  } else {
    res.render('error');
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});



// Make server listen
app.listen(PORT, () => {
  console.log('App is listening on http://localhost:' + PORT);
});



// Getting Access Token Here
async function getAccessToken(code) {
  // Making POST reauest to the github
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "client_id": clientId,
      "client_secret": clientSecret,
      "code": code
    })
  });

  const data = await res.text();
  const params = new URLSearchParams(data);
  return params.get('access_token');
}

// Getting Github User Here
async function getGithubUser(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${token}` }
  });

  const data = await res.json();
  return data;
}
