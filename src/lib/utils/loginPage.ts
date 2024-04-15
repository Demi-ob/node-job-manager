import { Request, Response, NextFunction } from "express";

export const loginPageData = (opts: {
  loginUrl: string;
  queueUrl: string;
}) => `<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
    body {
        background: #f5f8fa;
        font-family: 'Ubuntu', sans-serif;
        font-weight: 400;
        line-height: 1.25em;
        margin: 0;
        font-size: 16px;
        color: #454b52;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
    .login-page {
        width: 360px;
        padding: 8% 0 0;
        margin: auto;
    }
    .form {
        position: relative;
        z-index: 1;
        background: #FFFFFF;
        max-width: 360px;
        margin: 0 auto 100px;
        padding: 45px;
        text-align: center;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24);
    }
    .form input {
        font-family: inherit;
        outline: 0;
        background: #f2f2f2;
        width: 100%;
        border: 0;
        margin: 0 0 15px;
        padding: 15px;
        box-sizing: border-box;
        font-size: 14px;
    }
    .form button {
        font-family: inherit;
        text-transform: uppercase;
        outline: 0;
        background: hsl(217, 22%, 24%);
        width: 100%;
        border: 0;
        padding: 15px;
        color: #FFFFFF;
        font-size: 14px;
        -webkit-transition: all 0.3 ease;
        transition: all 0.3 ease;
        cursor: pointer;
    }
    .form button:hover,.form button:active,.form button:focus {
        background: hsl(217, 22%, 28%);
    }
    .form .message {
        margin: 15px 0 0;
        color: #b3b3b3;
        font-size: 12px;
    }
    .form .message a {
        color: hsl(217, 22%, 24%);
        text-decoration: none;
    }
    .container {
        position: relative;
        z-index: 1;
        max-width: 300px;
        margin: 0 auto;
    }
    .container:before, .container:after {
        content: "";
        display: block;
        clear: both;
    }
    .container .info {
        margin: 50px auto;
        text-align: center;
    }
    .container .info h1 {
        margin: 0 0 15px;
        padding: 0;
        font-size: 36px;
        font-weight: 300;
        color: #1a1a1a;
    }
    .container .info span {
        color: #4d4d4d;
        font-size: 12px;
    }
    .container .info span a {
        color: #000000;
        text-decoration: none;
    }
    .container .info span .fa {
        color: #EF3B3A;
    }
</style>

<div class="login-page">
    <div class="form">
        <form class="login-form">
            <input type="text" id="username" name="username" placeholder="Username"/>
            <input type="password" id="password" name="password" placeholder="Password"/>
            <button onclick="loginForm()">Login</button>

            <p class="message">Username: bull, Password: board</p>
        </form>
    </div>
</div>
<script>
  function loginForm() {
    event.preventDefault()
    const username=document.getElementById('username').value;
    const password=document.getElementById('password').value;
    fetch('${opts.loginUrl}',
      {
        method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username, password})
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if(data.success){
          location.href = '${opts.queueUrl}'
        }
      });
  }
</script>
`;

export const verifyLogin =
  (opts: { loginUrl: string; queueUrl: string }) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { session } = req as any;
    const loginHtml = loginPageData({
      loginUrl: opts.loginUrl,
      queueUrl: opts.queueUrl,
    });

    if (session.userid) {
      next();
    } else {
      res
        .set(
          "Content-Security-Policy",
          "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
        )
        .send(loginHtml);
    }
  };

export const attemptLogin =
  (opts: { bullBoardUsername?: string; bullBoardPassword?: string }) =>
  (req: Request, res: Response) => {
    console.log("attemptLogin", req.body);
    const username = opts.bullBoardUsername;
    const password = opts.bullBoardPassword;
    const { session } = req as any;

    if (req.body.username === username && req.body.password === password) {
      session.userid = req.body.username;
      res.json({ success: true });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }
  };
