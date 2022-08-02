import React, { useEffect } from "react";
import GradReviewer from "./GradReviewer";
import axios from "axios";

const apiUrls = {
  108: "https://script.google.com/macros/s/AKfycbwBJSRf4vg5TgwgGJW95oLfk_OrX0pSqwheFAHUoCBoS-ule8gLQwQF4sZReKXexRX8AQ/exec",
  109: "https://script.google.com/macros/s/AKfycbwU7mfMkA2lnuDofNyaq0h-cAPw4AFpHR3l2WLYTW3GtNhUUKW80YJk1eB61RpglUAf/exec",
};
let rules: never[] = [];
let ruleTag = [
  "創意與創業學分學程",
  "校訂必修",
  "院訂必修",
  "院訂必選",
  "英文必選",
  "網路專長",
  "資工專長",
  "電機專長",
  "電機專長-實驗群組",
  "電機專長-記號課程",
  "通訊專長",
];

function SelectGradReviewRule(checkTable:any) {
  const [ruleYear,setRuleYear] = React.useState("-- select an option -- ");
  const [ruleFecthingState,setRuleFecthingState] = React.useState("fetching rules");
  const handleChange = (e:any) =>{
    setRuleYear(e.target.value);
    //fetch api to update rule
    const selectedRuleYear = e.target.value as number;
    console.log(apiUrls[selectedRuleYear as keyof typeof apiUrls]);
    axios.get(apiUrls[selectedRuleYear as keyof typeof apiUrls]).then((res) =>{
      rules = res.data;
      setRuleFecthingState("rules are up to date");
      console.log(rules);
    }).catch((err) =>{
      console.log(err);
    });

  }
  return (
    <div>
      <select value={ruleYear} onChange={handleChange}>
        <option hidden selected > -- select an option -- </option>
        <option value="108">108</option>
        <option value="109">109</option>
        <option value="110">110</option>
        <option value="111">111</option>
      </select>
      <p>{ruleFecthingState}</p>
      <p>You have selected {ruleYear} !</p>
      <GradReviewer rule={rules} checkTable={checkTable}/>
    </div>

  );
}

export default SelectGradReviewRule;
