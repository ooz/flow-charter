// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Build the menu
const remote = require('electron').remote;
const appMenu = remote.Menu;
const dialog = remote.dialog;
// const {Menu, MenuItem} = remote

const React = require('react');
const ReactDOM = require('react-dom');
const ChartJS = require('chart.js');
const jsonfile = require('jsonfile');
const moment = require('moment');

import TagsInput from 'react-tagsinput';
const DatePicker = require('react-datepicker');
import Autosuggest from 'react-autosuggest';
const Slider = require('rc-slider');

const notifier = require('electron-notifications')

const packagejson = require('./package.json');

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dez"]
//let COLORS = ["Pink", "Purple", "Crimson", "Orange", "Yellow", "GreenYellow", "Cyan", "Navy", "Sienna", "Snow", "Gray"]
const COLORS = ["#FFC0CB", "#800080", "#DC143C", "#FFA500", "#FFFF00", "#ADFF2F", "#00FFFF", "#000080", "#A0522D", "#FFFAFA", "#808080"]
ChartJS.defaults.global.defaultFontColor = "#000000";

const NOTIFIER_OPTIONS = {
}

let dataFile;

const usedYears = (data, returnUsedMonths = 0) => {
    var ratings = getRatings(data);
    var years = [];
    for (var name in ratings) {
        if (ratings.hasOwnProperty(name)) {
            var userRatings = ratings[name];
            var userYears = userRatings.map((rating) => rating.date.split("-")[returnUsedMonths]);
            years.push(...userYears);
        }
    }

    // Unique years, then sort them
    years = [...(new Set(years))].sort();
    return years;
}

const getUsers = (data) => {
  var ratings = data.ratings;
  var users = [];
  for (var name in ratings) {
    if (ratings.hasOwnProperty(name)) {
      users.push(name);
    }
  }
  users = users.sort();
  return users;
}

const getTeams = (data) => {
  return data.teams;
}

const getTeamNames = (data) => {
  return getTeams(data).map(team => team.name);
}

const getRatings = (data, user="", date="") => {
  if (user != "") {
    var filtered = data.ratings[user] || [];
    filtered = filtered.filter(rating => rating.date == date);
    return filtered;
  }
  return data.ratings;
}

class NavItem extends React.Component {
  render() {
    return (
      <li className="nav-item"><a className="nav-link" href="#" onClick={() => this.props.clickHandler(this.props.name)}>{this.props.name}</a></li>
    );
  }
}

class Navigation extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-light bg-faded">
          <a className="navbar-brand" href="#" onClick={() => this.props.clickHandler("")}>
            <img src="img/owl_small.png" width="30" height="30" className="d-inline-block align-top" alt="" />
            Flow Charter
          </a>
        <ul className="nav navbar-nav">
          <NavItem name="Data"     clickHandler={this.props.clickHandler} />
          <NavItem name="Diagram"  clickHandler={this.props.clickHandler} />
        </ul>
      </nav>
    );
  }
}

class Content extends React.Component {
  render() {
    if (this.props.content === "Diagram") {
      return (<Diagram data={this.props.data} />);
    } else if (this.props.content === "Data") {
      return (<DataInput data={this.props.data} />);
    } else {
      return (
        <div>
          <h2>Welcome to Flow Charter!</h2>
          <p>Flow Charter lets you track the skill and challenge distributions of your teams. <br /> <br />
          v{packagejson.version} by Oliver Zscheyge</p>
          <h3>Instructions</h3>
          <p>What is challenge? What is skill?</p>
          <ul>
            <li>TODO</li>
            <li>TODO</li>
          </ul>
          <h3>Known Issues</h3>
          <ul>
            <li>The used chart package <code>chart.js</code> does not clean up data properly when creating a new chart (e.g. switching between teams or single team members). Thus prolonged use of this app will clog your system memory! :)<br /><br />
            Do not forget to save your work regularly!</li>
          </ul>
        </div>
      );
    }
  }
}

const RATING_MARKS = {0.0: "0%", 0.1: "10%", 0.2: "20%", 0.3: "30%", 0.4: "40%", 0.5: "50%", 0.6: "60%", 0.7: "70%", 0.8: "80%", 0.9: "90%", 1.0: "100%"}
class DataInput extends React.Component {
  constructor() {
      super()
      this.state = {
          // teams: [],
          ratingUser: "",
          ratingDate: moment(),
          ratingSkill: 0.5,
          ratingChallenge: 0.5,
          ratingComment: ""
      }
  }
  onTeamsChange(teams) {
      this.props.data.updateTeams(teams);
  }
  onTeamChange(teamName) {
      return (members) => {
        this.props.data.updateTeams({
          "name": teamName,
          "users": members
        });
      }
  }
  autosizingRenderInput (props) {
    let {onChange, value, ...other} = props
    return (
      <AutosizeInput type='text' onChange={onChange} value={value} {...other} />
    )
  }
  buildTeamInputs() {
      let items = []
      var props = {className: 'react-tagsinput-input', placeholder: '+ member'};
      var teams = getTeams(this.props.data);
      for (let i = 0; i < teams.length; ++i) {
        var team = teams[i];
        var teamName = team.name;
        items.push(<h4 key={"h4" + teamName}>{teamName}</h4>);
        items.push(<TagsInput key={"teamInput" + teamName} value={team.users} onChange={this.onTeamChange(teamName).bind(this)} maxTags={COLORS.length} inputProps={props} onlyUnique />);
      }
      return items;
  }
  onDateChanged(date) {
      this.setState({ratingDate: date});
      this.checkForExistingRating(this.state.ratingUser, date);
  }
  onUserChanged(newValue) {
      this.setState({ratingUser: newValue});
      this.checkForExistingRating(newValue, this.state.ratingDate);
  }
  checkForExistingRating(user, date) {
      var maybeExistingRating = getRatings(this.props.data, user, date.format("YYYY-MM-DD"));
      if (maybeExistingRating.length === 1) {
        var rating = maybeExistingRating[0];
        this.setState({
          ratingSkill: rating.skill,
          ratingChallenge: rating.challenge,
          ratingComment: rating.comment
        });
      }
  }
  getUserSuggestions() {
      var users = []
      var teams = getTeams(this.props.data);
      for (let i = 0; i < teams.length; ++i) {
        var team = teams[i];
        users.push(...team.users);
      }
      // Unique users
      users = [...(new Set(users))].sort();
      return users;
  }
  addUserRating() {
    var rating = {
      "name": this.state.ratingUser,
      "date": this.state.ratingDate.format("YYYY-MM-DD"),
      "skill": this.state.ratingSkill,
      "challenge": this.state.ratingChallenge,
      "comment": this.state.ratingComment
    }
    this.props.data.updateRatings(rating);
  }
  onSkillChanged(skill) {
    this.setState({ratingSkill: skill});
  }
  onChallengeChanged(challenge) {
    this.setState({ratingChallenge: challenge});
  }
  onCommentChanged(event) {
    this.setState({ratingComment: event.target.value});
  }
  buildRatingInputs() {
      let items = []
      items.push(<UserInput key="userInput" suggestions={this.getUserSuggestions()} onChange={this.onUserChanged.bind(this)} />)
      // items.push(<UserInput key="userInput" suggestions={["Oliver", "Olaf", "Foo", "Friedrich"]} onChange={this.onUserChanged.bind(this)} />)
      items.push(<DatePicker key="datePicker" className="form-control" dateFormat="YYYY/MM/DD" showYearDropdown showMonthDropdown locale="en-gb" selected={this.state.ratingDate} onChange={this.onDateChanged.bind(this)} />);
      items.push(<h4 key="h4Skill" style={{marginTop: "40px"}}>Skill</h4>);
      items.push(<Slider key="sliderSkill" min={0.0} max={1.0} step={0.05} value={this.state.ratingSkill} marks={RATING_MARKS} onChange={this.onSkillChanged.bind(this)} />);
      items.push(<h4 key="h4Challenge" style={{marginTop: "40px"}}>Challenge</h4>);
      items.push(<Slider key="sliderChallenge" min={0.0} max={1.0} step={0.05} value={this.state.ratingChallenge} marks={RATING_MARKS} onChange={this.onChallengeChanged.bind(this)} />);
      items.push(<h4 key="h4Comment" style={{marginTop: "40px"}}>Comment</h4>);
      items.push(<textarea key="commentInput" className="form-control" value={this.state.ratingComment} onChange={this.onCommentChanged.bind(this)} />);
      items.push(<button key="btnRate" className="btn btn-primary" onClick={this.addUserRating.bind(this)}>Rate</button>);
      return items;
  }
  render() {
    var props = {className: 'react-tagsinput-input', placeholder: '+ team'};
    return (
      <div>
        <h2>Data</h2>
        <h3>Ratings</h3>
        { this.buildRatingInputs() }
        <hr />
        <h3>Teams</h3>
        <TagsInput key="teamsInput" value={getTeamNames(this.props.data)} onChange={this.onTeamsChange.bind(this)} inputProps={props} onlyUnique />
        { this.buildTeamInputs() }
      </div>
    );
  }
}

class UserInput extends React.Component {
  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: []
    };
  }
  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : this.props.suggestions.filter(member =>
      member.toLowerCase().slice(0, inputLength) === inputValue
    );
  };
  onSuggestionsFetchRequested = ({value}) => {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  };
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  }
  onUserChanged(event, { newValue }) {
    this.setState({ value: newValue });
    this.props.onChange(newValue);
  }
  render() {
    const inputProps = {
      placeholder: 'Member to rate',
      value: this.state.value,
      onChange: this.onUserChanged.bind(this)
    };
    const theme = {
      container: 'autosuggest dropdown',
      containerOpen: 'dropdown open',
      input: 'form-control',
      suggestionsContainer: 'dropdown-menu',
      suggestion: 'list-group-item',
      suggestionFocused: 'bg-primary active',
      suggestionsList: 'list-group',
    };
    return (
      <Autosuggest
        theme={theme}
        suggestions={this.state.suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={(sug) => sug}
        renderSuggestion={(sug) => (<div>{sug}</div>)}
        inputProps={inputProps}
      />
    );
  }
}

const CHART_STYLE = {
    background: "linear-gradient(135deg, red, orange, orange, green, orange, orange, red)"
}
const CHART_OPTIONS = {
    legend: {
      onClick: (event, legendItem) => {},
      labels: {
        usePointStyle: true
      }
    },
    tooltips: {
        callbacks: {
          label: (tooltipItem, data) => {
            var dataItems = data.datasets[tooltipItem.datasetIndex].data.filter((d) => (d.x == tooltipItem.xLabel && d.y == tooltipItem.yLabel));
            var comment = "";
            var date = ""
            if (dataItems.length === 1) {
              comment = dataItems[0].comment;
              date = dataItems[0].date;
            }
            var nameValues = data.datasets[tooltipItem.datasetIndex].label + ", S: " + tooltipItem.xLabel + ", C: " + tooltipItem.yLabel;
            if (date !== "") {
              nameValues = date + " " + data.datasets[tooltipItem.datasetIndex].label + ", S: " + tooltipItem.xLabel + ", C: " + tooltipItem.yLabel;
            }
            if (comment === "") {
                return nameValues;
            } else {
                return [nameValues, comment];
            }
          },
        }
    },
    scales: {
        xAxes: [{
            ticks: {
                beginAtZero: true,
                fontColor: "#000",
                max: 1.0
            },
            scaleLabel: {
              display: true,
              labelString: "Skill (S)",
              fontColor: "#000",
              fontSize: 16
            }
        }],
        yAxes: [{
            gridLines: {
              offsetGridLines: true
            },
            ticks: {
                beginAtZero: true,
                fontColor: "#000",
                max: 1.0
            },
            scaleLabel: {
              display: true,
              labelString: "Challenge (C)",
              fontColor: "#000",
              fontSize: 16
            }
        }]
    },
    elements: {
        points: {
            borderWidth: 2,
            borderColor: 'rgb(0, 0, 0)'
        }
    }
}

class Diagram extends React.Component {
    constructor() {
        super();
        this.state = {
            team: "",
            userColor: COLORS[0],
            month: "monthAll",
            year: "yearLatest"
        };
    }
    componentDidMount() {
        this.renderChart(this.state.team);
    }
    componentDidUpdate() {
        this.renderChart(this.state.team);
    }
    cleanupCanvas() {
        var ctx = document.getElementById("chart_container");
        var newCanvas = document.createElement('canvas');
        ctx.parentNode.replaceChild(newCanvas, ctx);
        newCanvas.id = "chart_container";
        newCanvas.width = "400";
        newCanvas.height = "400";
        newCanvas.style = "background: " + CHART_STYLE.background;
        ctx = document.getElementById("chart_container");
        return ctx;
    }
    filterByTime(memberData, year, month) {
        var filtered = memberData;
        if (year !== "Latest" && year !== "All") {
            filtered = filtered.filter((d) => d.date.startsWith(year))
        } else if (year === "Latest") {
          if (filtered.length >= 2) {
            filtered = [filtered.reduce((a, b) => {return (a.date <= b.date) ? b : a})]
          }
        }
        if (month !== "All") {
            filtered = filtered.filter((d) => d.date.split("-")[1] == MONTH_NAMES.indexOf(month) + 1)
        }
        return filtered;
    }
    buildDataPoints(teamName, userColor) {
      var teams = getTeams(this.props.data);
      var users = getUsers(this.props.data);
      var ratings = getRatings(this.props.data);
      var month = this.state.month.replace("month", "");
      var year = this.state.year.replace("year", "");
      var team = teams.filter((t) => t.name === teamName);
      var user = users.filter((u) => u === teamName);
      var dataPoints = {};
      if (team.length === 1) {
          var members = team[0].users;
          var datasets = [];
          for (let i = 0; i < members.length; ++i) {
            var memberName = members[i];
            var memberRatings = ratings[memberName] || [];
            var memberData = memberRatings.map(r => {return {x: r.skill, y: r.challenge, r: 10, comment: r.comment, date: r.date}});
            memberData = this.filterByTime(memberData, year, month);
            var color = COLORS[i % COLORS.length];
            datasets.push({label: memberName, data: memberData, backgroundColor: color, hoverBackgroundColor: color});
          }
          dataPoints = {
              datasets: datasets
          };
      } else if (user.length === 1) {
        var userName = user[0];
        var datasets = [];
        var memberRatings = ratings[userName] || [];
        var memberData = memberRatings.map(r => {return {x: r.skill, y: r.challenge, r: 10, comment: r.comment, date: r.date}});
        memberData = this.filterByTime(memberData, year, month);
        var color = COLORS[0];
        datasets.push({label: userName, data: memberData, backgroundColor: userColor, hoverBackgroundColor: userColor});
        dataPoints = {
            datasets: datasets
        };

        // Reset team dropdown
        document.getElementById('teams').selectedIndex=0;
      }
      return dataPoints;
    }
    renderChart(teamName) {
        var dataPoints = []
        if (teamName !== "") {
          dataPoints = this.buildDataPoints(teamName, this.state.userColor);
        }

        var ctx = this.cleanupCanvas();

        let onChartClick = (event, legendItem) => {
          this.setState({team: legendItem.text, userColor: legendItem.fillStyle});
        }
        CHART_OPTIONS.legend.onClick = onChartClick;

        var flowChart = new Chart(ctx, {
            type: 'bubble',
            data: dataPoints,
            options: CHART_OPTIONS
        });
    }
    buildTeamOptions() {
        let items = [];
        var teams = getTeams(this.props.data);
        items.push(<option key="" value="">-</option>);
        for (let i = 0; i < teams.length; ++i) {
            let teamName = teams[i]["name"];
            items.push(<option key={teamName} value={teamName}>{teamName}</option>);
        }
        return items;
    }
    buildYearOptions(returnUsedMonths = 0) {
      let items = [];
      var years = usedYears(this.props.data, returnUsedMonths);
      if (returnUsedMonths) years = years.map((month_nr) => MONTH_NAMES[Number(month_nr) - 1]);
      if (returnUsedMonths === 0) {
        years.unshift("All");
        years.unshift("Latest");
      }
      for (let i = 0; i < years.length; ++i) {
        var identifier = "year" + years[i];
        var name = "years";
        var dateState = this.state.year;
        if (returnUsedMonths) {
          identifier = "month" + years[i];
          name = "months";
          dateState = this.state.month;
        }
        var labelClasses = "btn btn-primary btn-sm";
        if (dateState === identifier) {
          labelClasses += " active"
        }
        items.push(<label className={labelClasses} key={identifier}><input type="radio" name={name} id={identifier} value={identifier} autoComplete="off" onChange={(e) => this.onDateChanged(e)} checked={dateState === identifier} />{years[i]}</label>);
      }
      return items;
    }
    onDropdownSelected(e) {
      this.setState({team: e.target.value});
    }
    onDateChanged(e) {
      if (e.target.value.startsWith("year")) {
        if (e.target.value.includes("Latest") || e.target.value.includes("All")) {
          this.setState({year: e.target.value, month: "monthAll"});
        } else {
          this.setState({year: e.target.value});
        }
      } else {
        this.setState({month: e.target.value});
      }
    }
    render() {
        return (
          < div > < h2 > Diagram < /h2><div className="form-group"><label htmlFor="teams" className="control-label">Team: </label > < select id = "teams"
          name = "teams"
          className = "form-control"
          onChange={(e) => this.onDropdownSelected(e)}> {
              this.buildTeamOptions()
          } < /select></div > < canvas id = "chart_container"
          width = "400"
          height = "400"
          style = {
              CHART_STYLE
          } > < /canvas>
            <div className="container">
              <div className="row">
                <div className=".col-md-12 btn-group" data-toggle="buttons">
                  { this.buildYearOptions() }
                </div>
              </div>
              <div className="row">
                <div className=".col-md-12 btn-group" data-toggle="buttons">
                  { this.buildYearOptions(1) }
                </div>
              </div>
            </div>
          </div >
        );
    }
}

var getData;
var setData;
var self;

function _updateTeams(team) {
    var teams = this.teams;
    if (Array.isArray(team)) {
      // Update team list
      var newTeams = [];
      for (let i = 0; i < team.length; ++i) {
        var teamName = team[i];
        var oldTeam = teams.filter(t => t.name == teamName);
        var newUsers = [];
        if (oldTeam.length === 1) {
          oldTeam = oldTeam[0];
          newUsers = oldTeam.users.slice(0);
        }
        newTeams.push({
          "name": teamName,
          "users": newUsers
        })
      }
      this.teams = newTeams;
    } else {
      // Update a single team
      var maybeExistingTeam = this.teams.filter(t => t.name == team.name);
      if (maybeExistingTeam.length === 1) {
        maybeExistingTeam[0].users = team.users.slice(0);
      } else {
        this.teams.push({
          "name": new String(team.name),
          "users": team.users.slice(0)
        });
      }
    }
    self.setState({data: this});
}

function _updateRatings(rating) {
  var ratingsForName = this.ratings[rating.name] || [];
  // Check whether there is a rating for this date yet, if so update, else add new rating
  var ratingsAtDate = ratingsForName.filter(r => r.date == rating.date);
  if (ratingsAtDate.length === 1) {
    var oldRating = ratingsAtDate[0];
    oldRating.skill = rating.skill;
    oldRating.challenge = rating.challenge;
    oldRating.comment = new String(rating.comment);
    notifier.notify("Rating updated!", NOTIFIER_OPTIONS);
  } else {
    ratingsForName.push({
      "date": new String(rating.date),
      "skill": rating.skill,
      "challenge": rating.challenge,
      "comment": new String(rating.comment)
    });
    notifier.notify("Rating created!", NOTIFIER_OPTIONS);
  }
  this.ratings[rating.name] = ratingsForName;
  self.setState({data: this});
}

class FlowCharter extends React.Component {
  constructor() {
     super();
     self = this;
     this.state = {
         content: "",
         data: {
             "version": "1.0.0",
             "teams": [],
             "ratings": {},
             "updateTeams": _updateTeams,
             "updateRatings": _updateRatings
         }
     };
     this.state.data.updateTeams = this.state.data.updateTeams.bind(this.state.data);
     this.state.data.updateRatings = this.state.data.updateRatings.bind(this.state.data);
     getData = function() {
       return this.state.data;
     }
     getData = getData.bind(this);
     setData = function(data) {
       data["updateTeams"] = _updateTeams.bind(data);
       data["updateRatings"] = _updateRatings.bind(data);
       this.setState({data});
     }
     setData = setData.bind(this);
  }
  handleClick(toView) {
    this.setState({content: toView});
  }
  render() {
    return (<div className="container">
              <Navigation clickHandler={this.handleClick.bind(this)} />
              <Content content={this.state.content} data={this.state.data} />
            </div>);
  }
}

ReactDOM.render(<FlowCharter />, document.getElementById('root'));

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
            dialog.showOpenDialog(function(fileNames) {
                if (fileNames === undefined) {
                } else {
                    dataFile = fileNames[0];
                    var data = jsonfile.readFileSync(fileNames[0]);
                    setData(data);
                }
            });
        }
      },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          if (dataFile !== undefined) {
            jsonfile.writeFileSync(dataFile, getData());
            notifier.notify("Saved!", NOTIFIER_OPTIONS);
          } else {
            dialog.showSaveDialog(function(fileName) {
                if (fileName === undefined) {
                    return;
                }

                dataFile = fileName;
                jsonfile.writeFileSync(fileName, getData());
                notifier.notify("Saved!", NOTIFIER_OPTIONS);
            });
          }
        }
      },
      {
        label: 'Save as...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => {
          dialog.showSaveDialog(function(fileName) {
              if (fileName === undefined) {
                  return;
              }

              dataFile = fileName;
              jsonfile.writeFileSync(fileName, getData());
              notifier.notify("Saved!", NOTIFIER_OPTIONS);
          });
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'quit',
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'pasteandmatchstyle'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize'
      },
      {
        role: 'close'
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
  // Window menu.
  template[3].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  ]
}

const menu = appMenu.buildFromTemplate(template)
appMenu.setApplicationMenu(menu)
