<h1 align='center'>Agile Bot for Rocket.Chat</h1>
 
The AgileBot app automates a lot of your tasks as managers, and lets you focus on the things that are important. Automate standup threads, generate summary for standups to save time, schedule meetings in advance, make anonymous polls and more!

<h2 align='center'>🚀 Features 🚀</h2>
<ul>
  <li>Automatic standup threads: No more asking for updates every Monday and Friday!</li> 
  <li>Create anonymous polls and get detailed staistics on your DM, only the verdict goes to the channel.</li>
  <li>Summarize standup threads using LLMs. Get the names of everyone who didn't post messages!</li>
  <li>Set meeting reminders for the day in advance. AgileBot will remind everyone to join!</li>
</ul>

<h2 align="center">💡 Usage 💡</h2>

### Command List

<ul>
    <li><strong>Configure the days, time and the message to be sent for standup threads →</strong> <code>/agile-settings</code></li>
    <li><strong>Set meeting reminders for your upcoming meetings →</strong> <code>/agile-meeting-reminder</code></li>
    <li><strong>Manually initate a standup thread, wherever needed! →</strong> <code>/agile-standup-thread</code></li>
    <li><strong>Use the power of LLMs to generate a summary for the standup thread!→</strong> <code>/agile-standup-summary</code></li>
    <li><strong>Launch an anonymous poll with only Yes/No answers! Get detailed stats DMed to you by AgileBot! →</strong> <code>/agile-poll</code></li>
</ul>

<h2 align='center'>🚀 Contributing 🚀</h2>

<ol>
  <li>Rocket.Chat Apps Run on a Rocket.Chat server. If you dont have a server setup, please go through this <a href="https://developer.rocket.chat/rocket.chat/rocket-chat-environment-setup">setup</a> and setup a development environment and setup you server</li> 
  <li>To start with development on Rocket.Chat Apps, you need to install the Rocket.Chat Apps Engline CLI. Enter the following commands : </li>
  
  ``` 
    npm install -g @rocket.chat/apps-cli
  ```
  
  Check if the CLI has been installed 
  
  ```
  rc-apps -v
# @rocket.chat/apps-cli/1.4.0 darwin-x64 node-v10.15.3
  ```
  
  <li>Clone the GitHub Repository</li>
    
 ```
    git clone https://github.com/RocketChat/AgileBot.git
 ```
  
  <li>Enter the AgileBot directory</li>
  
  ```
    cd AgileBot
  ```

  <li>Install the required dependencies</li>
  
  ```
    npm install
  ```
  
  <li>In order to install Rocket.Chat Apps on your development server, the server must be in development mode. Enable Apps development mode by navigating to <i>Administration > General > Apps</i> and click on the True radio button over the Enable development mode..</li>
    
  ```
  rc-apps deploy --url http://localhost:3000 --username <username> --password <password>
  ```
  
  Where:
  http://localhost:3000 is your local server URL (if you are running in another port, change the 3000 to the appropriate port).
  `username` is the username of your admin user.
  `password` is the password of your admin user.
  If you want to update the app deployed in your Rocket.Chat instance after making changes to it, you can run:
  
  ```
  rc-apps deploy --url http://localhost:3000 --username user_username --password user_password --update
  ```
</ol>

The Application is now installed on the server. You can verify this by checking the installed applications from the administration panel.
