// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const React = require('react');
const ReactDOM = require('react-dom');
const ChartJS = require('chart.js');
const jsonfile = require('jsonfile');

import TagsInput from 'react-tagsinput'

const packagejson = require('./package.json');

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dez"]
//let COLORS = ["Pink", "Purple", "Crimson", "Orange", "Yellow", "GreenYellow", "Cyan", "Navy", "Sienna", "Snow", "Gray"]
const COLORS = ["#FFC0CB", "#800080", "#DC143C", "#FFA500", "#FFFF00", "#ADFF2F", "#00FFFF", "#000080", "#A0522D", "#FFFAFA", "#808080"]
ChartJS.defaults.global.defaultFontColor = "#000000";

let data = {
    "version": "1.0.0",
    "users": [
        "A Foo",
        "O Bar",
        "F Baz",
        "M Bob"
    ],
    "teams": [{
        "name": "foobars",
        "users": [
            "A Foo",
            "O Bar"
        ]
    }, {
        "name": "bobfoos",
        "users": [
            "F Baz",
            "M Bob"
        ]
    }],
    "ratings": {
        "O Bar": [{
            "date": "2016-01-12",
            "skill": 0.5,
            "challenge": 0.5,
            "comment": "Test"
        }, {
            "date": "2016-12-13",
            "skill": 0.7,
            "challenge": 0.6,
            "comment": "Test two"
        }],
        "A Foo": [{
            "date": "2016-12-12",
            "skill": 0.5,
            "challenge": 0.5,
            "comment": "Test2"
        }, {
            "date": "2016-12-13",
            "skill": 0.9,
            "challenge": 0.9,
            "comment": "Test two2"
        }],
        "F Baz": [{
            "date": "2016-12-12",
            "skill": 0.5,
            "challenge": 0.5,
            "comment": "Test"
        }, {
            "date": "2016-12-13",
            "skill": 0.7,
            "challenge": 0.6,
            "comment": "Test two"
        }],
        "M Bob": [{
            "date": "2015-12-12",
            "skill": 0.6,
            "challenge": 0.6,
            "comment": "Test2"
        }, {
            "date": "2016-12-13",
            "skill": 0.9,
            "challenge": 0.9,
            "comment": "Test two2"
        }]
    }
}

let data_file = "flow_charter_data.json"

const usedYears = (returnUsedMonths = 0) => {
    var ratings = data.ratings;
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
      return (<Diagram />);
    } else if (this.props.content === "Data") {
      return (<DataInput />);
    } else {
      return (
        <div>
          <h2>Welcome to Flow Charter!</h2>
          <p>Flow Charter lets you track the skill and challenge distributions of your teams. <br /> <br />
          v{packagejson.version} by Oliver Zscheyge</p>
          <h3>Instructions</h3>
          <p>What is challenge? What is skill?</p>
          <ul><li>Foo</li><li>Bar</li></ul>
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

class DataInput extends React.Component {
  constructor() {
      super()
      this.state = {
          teams: []
      }
  }
  onTeamsChange(teams) {
      this.setState({teams});
      for (let i = 0; i < teams.length; ++i) {
          var teamName = teams[i];
          if (typeof(this.state["_" + teamName]) === 'undefined') {
              this.setState({["_" + teamName]: []});
          }
      }

      // Cleanup deleted teams
      for (var team in this.state) {
          if (this.state.hasOwnProperty(team) && team.startsWith("_")) {
              if (!teams.map((t) => {return "_" + t}).includes(team)) {
                  this.setState({[team] : undefined});
              }
          }
      }
  }
  onTeamChange(teamName) {
      return (members) => {
        if (typeof(this.state["_" + teamName]) !== 'undefined') {
          this.setState({["_" + teamName]: members});
        }
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
      for (let i = 0; i < this.state.teams.length; ++i) {
        var teamName = this.state.teams[i];
        items.push(<h4 key={"h4" + teamName}>{teamName}</h4>);
        if (typeof(this.state["_" + teamName]) !== 'undefined') {
          items.push(<TagsInput key={"teamInput" + teamName} value={this.state["_" + teamName]} onChange={this.onTeamChange(teamName).bind(this)} maxTags={COLORS.length} inputProps={props} onlyUnique />);
        }
      }
      return items;
  }
  render() {
    var props = {className: 'react-tagsinput-input', placeholder: '+ team'};
    return (
      <div>
        <h2>Data</h2>
        <h3>Teams</h3>
        <TagsInput key="teamsInput" value={this.state.teams} onChange={this.onTeamsChange.bind(this)} inputProps={props} onlyUnique />
        { this.buildTeamInputs() }
        <h3>Ratings</h3>

      </div>
    );
  }
}

const CHART_STYLE = {
    background: "linear-gradient(135deg, red, red, green, red, red)"
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
            filtered = [filtered.reduce((a, b) => {return (a <= b) ? b : a})]
        }
        if (month !== "All") {
            filtered = filtered.filter((d) => d.date.split("-")[1] == MONTH_NAMES.indexOf(month) + 1)
        }
        return filtered;
    }
    buildDataPoints(teamName, userColor) {
      var teams = data.teams;
      var users = data.users;
      var month = this.state.month.replace("month", "");
      var year = this.state.year.replace("year", "");
      var team = teams.filter((t) => t["name"] === teamName);
      var user = users.filter((u) => u === teamName);
      var dataPoints = {};
      if (team.length === 1) {
          var members = team[0].users;
          var datasets = [];
          for (let i = 0; i < members.length; ++i) {
            var memberName = members[i];
            var memberRatings = data.ratings[memberName];
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
        var memberRatings = data.ratings[userName];
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
        var dataPoints = this.buildDataPoints(teamName, this.state.userColor);

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
        items.push(<option key="" value="">-</option>);
        for (let i = 0; i < data["teams"].length; ++i) {
            let teamName = data["teams"][i]["name"];
            items.push(<option key={teamName} value={teamName}>{teamName}</option>);
        }
        return items;
    }
    buildYearOptions(returnUsedMonths = 0) {
      let items = [];
      var years = usedYears(returnUsedMonths);
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

class FlowCharter extends React.Component {
  constructor() {
   super();
   this.state = {
       content: ""
   };
  }
  handleClick(toView) {
    this.setState({content: toView});
  }
  render() {
    return (<div className="container"><Navigation clickHandler={this.handleClick.bind(this)} /><Content content={this.state.content} /></div>);
  }
}

ReactDOM.render(<FlowCharter />, document.getElementById('root'));

function saveData() {
  jsonfile.writeFile(data_file, data, function (err) {
    console.error(err)
  })
}
