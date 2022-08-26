# Getting Started with IPEECS Graduation Reviewer Chrome Extension

This is a useful tool dedicated to help students in NCU IPEECS program reviewing their graduation progress. After check your course record with selected rules, it will generate a HTML file with detailed information of whether your record fits the rule, so you can get the suggestions and warnings of future course planning.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# Installation

### Step 1

Clone this project to your desired directory.

e.g. `D:\NCU`

run `git clone https://github.com/AlexPeng517/IPEECSGradReviewer.git`

### Step 2

Switch to the project directory that you have cloned in the previous step.

e.g. `cd D:\NCU\IPEECSGradReviewer`

### Step 3

run `npm i` to install all dependencies.

### Step 4

run `npm run build` to start building the project.
After building up, you may see a directory call `build` appear in the project directory.

### Step 5

Start your Chrome, type `chrome://extensions` in your URL bar to navigate to the setting page.

Then, enable developers mode (rightmost of navbar)

![](https://i.imgur.com/CRYm1l7.png)

### Step 5

Select loading unencapsulated project option (leftmost of navbar)

![](https://i.imgur.com/2XSH43O.png)

Load the `build` directory that appears after step 4.

After loaded, type `chrome://restart` in your URL bar to restart Chrome in case the extension not loaded successfully.

# Useage

### Step 1

If you didn't logged in to NCU Portal first, refer to UI, will guide you to the login page via a link below.

![notLoggedIn](https://i.imgur.com/wTpRZpH.png)

### Step 2

If you logged in, it will fetch your courses record automatically, please wait for a second.

Then you can select a specific graduation rules by years, please refer to the first three numbers of your student ID or your enrollment year. 

![LoggedIn](https://i.imgur.com/a8w8SY7.png)

### Step 3

After select a correct year, it will update its review rules automatically, please wait for a second.

![selectedAYear](https://i.imgur.com/tI4CVu5.png)

### Step 4

Once all data is up to date, you can click the `check` button to start reviewing.

When reviewing process ended, you can download the result by clicking the link right beside the `check` button

![checkAndDownload](https://i.imgur.com/iVzl1AK.png)

### Step 5

The result report filename is validate.html, you can use any browser to open it.

![reportDemo](https://i.imgur.com/ad4rO9p.png)


# Disclaimer:
All The Data Is Processed Automatically And Locally, The Developer Team Will Not Gather Any User Data In Any Way.











