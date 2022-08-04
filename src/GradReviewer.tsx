import React from "react";
import { CheckTableContext } from "./FetchGradeTable";

export interface CategoryCourses {
  [key: string]: Array<string>;
}
export interface CategoryCredits {
  [key: string]: number;
}

function getAllCategoryCourse(obj: any, data: any) {
  let categoryCourses: CategoryCourses = {};
  let categoryCredits: CategoryCredits = {};
  obj["規則"].forEach((rule: any) => {
    // console.log(rule);
    categoryCourses[rule[0]] = [];
    categoryCredits[rule[0]] = 0;
  });

  // 抓出所有創意與創業課程
  // 但有些課程可互相抵修的應該不能個別算學分
  let checkedRule = new Set();
  //   console.log("data: ", data);
  data.forEach((course: any) => {
    obj["規則"].forEach((rule: any) => {
      rule[2].forEach((r: any) => {
        // 因為有可互相抵修的課程(使用兩個 array 包住，所以取兩層)，使用 includes
        if (obj["可抵修"] === true) {
          if (r.includes(course.name) && !checkedRule.has(r)) {
            categoryCourses[rule[0]].push(course.name);
            categoryCredits[rule[0]] += parseInt(course.credits);
            checkedRule.add(r);
          }
        } else if (obj["可抵修"] === false) {
          if (course.name.match(r)) {
            if (categoryCourses[rule[0]].includes(course.name)) {
              return;
            }
            // console.log(course.name);
            categoryCourses[rule[0]].push(course.name);
            categoryCredits[rule[0]] += parseInt(course.credits);
          }
        } else if (obj["可抵修"] === "en") {
          if (course.name.match(/LN29((?!00)[0-4]\d|50)/gm)) {
            categoryCourses[rule[0]].push(course.name);
            categoryCredits[rule[0]] += parseInt(course.credits);
          }
        }
      });
    });
  });
  return [categoryCourses, categoryCredits];
}
function validateCourses(obj: { 課程: any; 學分: any; 規則: any }) {
  let validation: any = [];
  let totalCredits: number = 0;
  let pass: boolean = true;

  obj["規則"].forEach((rule: any) => {
    totalCredits += obj["學分"][rule[0]];
    if (obj["學分"][rule[0]] >= rule[1]) {
      validation.push({
        name: rule[0],
        valid: true,
        response: `${rule[0]} 符合規定，共 ${obj["學分"][rule[0]]} 學分`,
      });
    } else {
      pass = false;
      validation.push({
        name: rule[0],
        valid: false,
        response: `${rule[0]} 不符合規定，共 ${
          obj["學分"][rule[0]]
        } 學分，已修習 ${obj["課程"][rule[0]]} 的課程`,
      });
    }
  });
  return [validation, totalCredits, pass];
}

function clearCourses(obj: any, data: any) {
  let arr = Object.values(obj);
  data = Object.values(data);
  arr.forEach((category: any) => {
    // console.log("clear course data: ", data);
    // console.log("clear course category: ", category);
    data = data.filter((course: any) => {
      return !category.includes(course.name);
    });
  });
  // console.log(data);
  return data;
}
// check total credits
function checkTotalCredits(checkTableData: any) {
  let totalCredits = 0;
  for (let i = 0; i < checkTableData.length; i++) {
    totalCredits += parseInt(checkTableData[i].credits);
  }
  totalCredits < 128
    ? console.log("總學分：不通過，低於 128")
    : console.log("總學分：通過");
}

// check creative-and-startup credits
function checkCreativeAndStartupCredits(
  data: any,
  rules: { [key: string]: any }
) {
  console.log("check creative-and-startup credits");
  console.log(rules);
  console.log("data in check creative", data);
  let creativeAndStartupRules = rules["rule"]["創意與創業學分學程"];
  console.log(creativeAndStartupRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: creativeAndStartupRules,
      可抵修: true,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: creativeAndStartupRules,
  });

  console.log(validation);

  let final = totalCredits >= 15 && pass;
  final
    ? console.log("創意與創業學分學程：通過")
    : console.log("創意與創業學分學程：不通過", "已修", categoryCourses);
}

// check school-required credits 非重複計算
function checkSchoolRequiredCredits(data: any, rules: { [key: string]: any }) {
  let schoolRequiredRules = rules["rule"]["校訂必修"];
  console.log(schoolRequiredRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: schoolRequiredRules,
      可抵修: false,
    },
    data
  );

  let tmp: any = categoryCourses["進階體育"];
  categoryCourses["進階體育"] = tmp.filter(
    (course: any) => course !== "PE1011" && course !== "PE1022"
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: schoolRequiredRules,
  });

  let checkCourseNumbers = [
    ["體育", 2],
    ["進階體育", 3],
    ["服務學習課程", 2],
    ["通識", 1, "CC"],
  ];
  checkCourseNumbers.forEach((courseNumber: any[]) => {
    if (Object.keys(categoryCourses[courseNumber[0]]) < courseNumber[1]) {
      pass = false;
      let tmp = validation.findIndex((v: any) => v.name === courseNumber[0]);
      if (tmp) {
        validation[tmp] = {
          name: courseNumber[0],
          valid: false,
          response: `${courseNumber[0]}不符合規定，已修習 ${
            categoryCourses[courseNumber[0]]
          } 的課程`,
        };
      }
    }
  });

  console.log(validation);

  let final = totalCredits >= 25 && pass;
  final
    ? console.log("校訂必修：通過")
    : console.log("校訂必修：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check academy-required credits 非重複計算
function checkAcademyRequiredCredits(data: any, rules: { [key: string]: any }) {
  let academyRequiredRules = rules["rule"]["院訂必修"];
  console.log(academyRequiredRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: academyRequiredRules,
      可抵修: false,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: academyRequiredRules,
  });

  console.log(validation);

  let final = totalCredits >= 24 && pass;
  final
    ? console.log("院訂必修：通過")
    : console.log("院訂必修：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check academy-elective credits
function checkAcademyElectiveCredits(data: any, rules: { [key: string]: any }) {
  let academyElectiveRules = rules["rule"]["院訂必選"];
  console.log(academyElectiveRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: academyElectiveRules,
      可抵修: false,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: academyElectiveRules,
  });

  console.log(validation);

  let final = totalCredits >= 6;
  final
    ? console.log("院訂必選：通過")
    : console.log("院訂必選：不通過", "已修", categoryCourses);
}

// check english-required credits
function checkEnglishRequiredCredits(data: any, rules: { [key: string]: any }) {
  let englishElectiveRules = rules["rule"]["英文必選"];
  console.log(englishElectiveRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: englishElectiveRules,
      可抵修: "en",
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: englishElectiveRules,
  });

  console.log(validation);

  let final = totalCredits >= 2 && pass;
  final
    ? console.log("英文必選：通過")
    : console.log("英文必選：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// CS-major
// check CS-major credits
function checkCSMajorCredits(data: any, rules: { [key: string]: any }) {
  data = checkCSMajorRequiredCredits(data, rules);
  checkCSMajorElectiveCredits(data, rules);
}

// check CS-major-required credits
function checkCSMajorRequiredCredits(data: any, rules: { [key: string]: any }) {
  let CSMajorRequiredRules = [rules["rule"]["資工專長"][0]];

  console.log(CSMajorRequiredRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: CSMajorRequiredRules,
      可抵修: true,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: CSMajorRequiredRules,
  });

  console.log(validation);

  let final = totalCredits >= 34 && pass;
  final
    ? console.log("資工專長必修：通過")
    : console.log("資工專長必修：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check CS-major-elective credits
function checkCSMajorElectiveCredits(data: any, rules: { [key: string]: any }) {
  let CSMajorElectiveRules = [rules["rule"]["資工專長"][1]];

  console.log(CSMajorElectiveRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: CSMajorElectiveRules,
      可抵修: false,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: CSMajorElectiveRules,
  });

  console.log(validation);

  let final = totalCredits >= 21 && pass;
  final
    ? console.log("資工專長-其他選修：通過")
    : console.log("資工專長-其他選修：不通過", "已修", categoryCourses);
}

// network-major
// check network-major credits
function checkNetworkMajorCredits(data: any, rules: { [key: string]: any }) {
  data = checkNetworkMajorRequiredCredits(data, rules);
  checkNetworkMajorElectiveCredits(data, rules);
}

// check network-major-required credits
function checkNetworkMajorRequiredCredits(
  data: any,
  rules: { [key: string]: any }
) {
  let networkMajorRequiredRules = [rules["rule"]["網路專長"][0]];

  console.log(networkMajorRequiredRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: networkMajorRequiredRules,
      可抵修: true,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: networkMajorRequiredRules,
  });

  console.log(validation);

  let final = totalCredits >= 31 && pass;
  final
    ? console.log("網路專長必修：通過")
    : console.log("網路專長必修：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check network-major-elective credits
function checkNetworkMajorElectiveCredits(
  data: any,
  rules: { [key: string]: any }
) {
  let networkMajorElectiveRules = [rules["rule"]["網路專長"][1]];

  console.log(networkMajorElectiveRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: networkMajorElectiveRules,
      可抵修: false,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: networkMajorElectiveRules,
  });

  console.log(validation);

  let final = totalCredits >= 21 && pass;
  final
    ? console.log("網路專長-其他選修：通過")
    : console.log("網路專長-其他選修：不通過", "已修", categoryCourses);
}

// CO-major
// check CO-major credits
function checkCOMajorCredits(data: any, rules: { [key: string]: any }) {
  data = checkCOMajorRequiredCredits(data, rules);
  checkCOMajorElectiveCredits(data, rules);
}

// check CO-major-required credits
function checkCOMajorRequiredCredits(data: any, rules: { [key: string]: any }) {
  let COMajorRequiredRules = [
    rules["rule"]["通訊專長"][0],
    rules["rule"]["通訊專長"][1],
  ];

  console.log(COMajorRequiredRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: COMajorRequiredRules,
      可抵修: true,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: COMajorRequiredRules,
  });

  console.log(validation);

  let final = totalCredits >= 42 && pass;
  final
    ? console.log("通訊專長-必修必選：通過")
    : console.log("通訊專長-必修必選：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check CO-major-elective credits
function checkCOMajorElectiveCredits(data: any, rules: { [key: string]: any }) {
  let COMajorElectiveRules = [rules["rule"]["通訊專長"][2]];

  console.log(COMajorElectiveRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: COMajorElectiveRules,
      可抵修: false,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: COMajorElectiveRules,
  });

  console.log(validation);

  let final = totalCredits >= 12 && pass;
  final
    ? console.log("通訊專長-其他選修：通過")
    : console.log("通訊專長-其他選修：不通過", "已修", categoryCourses);
}

// EE-major
// check EE-major credits
function checkEEMajorCredits(data: any, rules: { [key: string]: any }) {
  data = checkEEMajorRequiredCredits(data, rules);
  data = checkEEMajorExperienceCredits(data, rules);
  data = checkEEMajorMarkCourseCredits(data, rules);
  checkEEMajorElectiveCredits(data, rules);
}

// check EE-major-required credits
function checkEEMajorRequiredCredits(data: any, rules: { [key: string]: any }) {
  let EEMajorRequiredRules = [rules["rule"]["電機專長"][0]];

  console.log(EEMajorRequiredRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: EEMajorRequiredRules,
      可抵修: true,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: EEMajorRequiredRules,
  });

  console.log(validation);

  let final = totalCredits >= 42 && pass;
  final
    ? console.log("電機專長必修：通過")
    : console.log("電機專長必修：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check EE-major-experience credits
function checkEEMajorExperienceCredits(
  data: any,
  rules: { [key: string]: any }
) {
  let EEMajorExperienceRules = rules["rule"]["電機專長-實驗群組"];

  console.log(EEMajorExperienceRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: EEMajorExperienceRules,
      可抵修: true,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: EEMajorExperienceRules,
  });

  console.log(validation);

  let final = totalCredits >= 9 && pass;
  final
    ? console.log("電機專長-實驗群組：通過")
    : console.log("電機專長-實驗群組：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check EE-major-markCourse credits
function checkEEMajorMarkCourseCredits(
  data: any,
  rules: { [key: string]: any }
) {
  let EEMajorMarkCourseRules = rules["rule"]["電機專長-記號課程"];

  console.log(EEMajorMarkCourseRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: EEMajorMarkCourseRules,
      可抵修: true,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: EEMajorMarkCourseRules,
  });

  console.log(validation);

  let classes = 0;
  validation.forEach((result: any) => {
    if (result.valid) {
      classes++;
    }
  });

  let final = totalCredits >= 18 && classes >= 3;
  final
    ? console.log("電機專長-記號課程：通過")
    : console.log("電機專長-記號課程：不通過", "已修", categoryCourses);

  return clearCourses(categoryCourses, data);
}

// check EE-major-elective credits
function checkEEMajorElectiveCredits(data: any, rules: { [key: string]: any }) {
  let EEMajorElectiveRules = [rules["rule"]["電機專長"][1]];

  console.log(EEMajorElectiveRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: EEMajorElectiveRules,
      可抵修: false,
    },
    data
  );

  console.log(`符合的課程：`, categoryCourses);
  console.log(`符合的學分：`, categoryCredits);

  let [validation, totalCredits, pass] = validateCourses({
    課程: categoryCourses,
    學分: categoryCredits,
    規則: EEMajorElectiveRules,
  });

  console.log(validation);

  let final = totalCredits >= 12 && pass;
  final
    ? console.log("電機專長-其他選修：通過")
    : console.log("電機專長-其他選修：不通過", "已修", categoryCourses);
}

async function validation(checkTable: any, rules: { [key: string]: any }) {
  // 有 return => 不可重複計算
  console.log("<===========================================================>");
  let data = structuredClone(checkTable);
  console.log("<===========================================================>");
  await checkTotalCredits(data["checkTable"]);
  console.log("<===========================================================>");
  await checkCreativeAndStartupCredits(data["checkTable"], rules);
  console.log("<===========================================================>");
  data = await checkSchoolRequiredCredits(data["checkTable"], rules);
  console.log("<===========================================================>");
  data = await checkAcademyRequiredCredits(data, rules);
  console.log("<===========================================================>");
  await checkAcademyElectiveCredits(data, rules);
  console.log("<===========================================================>");
  data = await checkEnglishRequiredCredits(data, rules);
  console.log("<===========================================================>");

  // 各自用自己的，因為會要去掉重複的課程
  let CSData = structuredClone(data);
  await checkCSMajorCredits(CSData, rules);
  console.log("<===========================================================>");
  let NetWorkData = structuredClone(data);
  await checkNetworkMajorCredits(NetWorkData, rules);
  console.log("<===========================================================>");
  let COData = structuredClone(data);
  await checkCOMajorCredits(COData, rules);
  console.log("<===========================================================>");
  let EEData = structuredClone(data);
  await checkEEMajorCredits(EEData, rules);
  console.log("<===========================================================>");
}

function GradReviewer(rules: { [key: string]: any }) {
  const checkTable = React.useContext(CheckTableContext);
  const handleClick = () => {
    console.log("checkTable: ", checkTable);
    validation(checkTable, rules);
  };

  return (
    <div>
      <button onClick={handleClick}>check</button>
    </div>
  );
}

export default GradReviewer;
