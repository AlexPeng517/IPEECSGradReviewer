import React from "react";
import GradReviewer from "./GradReviewer";
function SelectGradReviewRule() {
  const [rule,setRule] = React.useState("108");
  const handleChange = (e:any) =>{
    setRule(e.target.value);
    //fetch api to update rule
  }
  return (
    <div>
      <select value={rule} onChange={handleChange}>
        <option value="108">108</option>
        <option value="109">109</option>
        <option value="110">110</option>
        <option value="111">111</option>
      </select>
      <p>You have selected {rule} !</p>
      <GradReviewer rule={rule}/>
    </div>

  );
}

export default SelectGradReviewRule;
