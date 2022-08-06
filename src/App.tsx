import logo from './logo192.png';
import FetchGradeTable from './FetchGradeTable';
import './App.css';



function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to IPEECS Graduation Review System.
        </p>
        <a
          className="App-link"
          href="http://www.ipeecs.ncu.edu.tw/ipeecs/zh/rule/program"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn IPEECS Graduation Rules
        </a>
        <FetchGradeTable/>
      </header>
    </div>
  );
}

export default App;
