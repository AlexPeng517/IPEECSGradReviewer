import React from "react";
import { CheckTableContext } from "./FetchGradeTable";

let commonObj: any;
let majorObj: any;

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
        credits: obj["學分"][rule[0]],
        courses: obj["課程"][rule[0]],
      });
    } else {
      pass = false;
      validation.push({
        name: rule[0],
        valid: false,
        credits: obj["學分"][rule[0]],
        courses: obj["課程"][rule[0]],
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
  let validation = 0;
  for (let i = 0; i < checkTableData.length; i++) {
    validation += parseInt(checkTableData[i].credits);
  }
  let final = validation >= 128;
  validation < 128
    ? console.log("總學分：不通過，低於 128")
    : console.log("總學分：通過");

  commonObj["總學分"] = { final, validation };
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

  commonObj["創意與創業學分學程"] = { final, validation };
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

  commonObj["校訂必修"] = { final, validation };

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

  commonObj["院訂必修"] = { final, validation };

  return clearCourses(categoryCourses, data);
}

// check academy-elective credits
function checkAcademyElectiveCredits(data: any, rules: { [key: string]: any }) {
  let academyElectiveRules = rules["rule"]["院訂必選"];
  console.log(academyElectiveRules);

  let [categoryCourses, categoryCredits] = getAllCategoryCourse(
    {
      規則: academyElectiveRules,
      可抵修: true,
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

  commonObj["院訂必選"] = { final, validation };
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

  commonObj["英文必選"] = { final, validation };

  return clearCourses(categoryCourses, data);
}

// CS-major
// check CS-major credits
function checkCSMajorCredits(data: any, rules: { [key: string]: any }) {
  majorObj["資工專長"] = {};
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

  majorObj["資工專長"]["必修"] = { final, validation };
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

  majorObj["資工專長"]["其他選修"] = { final, validation };
}

// network-major
// check network-major credits
function checkNetworkMajorCredits(data: any, rules: { [key: string]: any }) {
  majorObj["網路專長"] = {};
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

  majorObj["網路專長"]["必修"] = { final, validation };

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

  majorObj["網路專長"]["其他選修"] = { final, validation };
}

// CO-major
// check CO-major credits
function checkCOMajorCredits(data: any, rules: { [key: string]: any }) {
  majorObj["通訊專長"] = {};
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

  majorObj["通訊專長"]["必修"] = { final, validation };

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

  majorObj["通訊專長"]["其他選修"] = { final, validation };
}

// EE-major
// check EE-major credits
function checkEEMajorCredits(data: any, rules: { [key: string]: any }) {
  majorObj["電機專長"] = {};
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

  majorObj["電機專長"]["必修"] = { final, validation };

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

  majorObj["電機專長"]["實驗群組"] = { final, validation };

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

  majorObj["電機專長"]["記號課程"] = { final, validation };

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

  majorObj["電機專長"]["其他選修"] = { final, validation };
}

async function validation(checkTable: any, rules: { [key: string]: any }) {
  // 有 return => 不可重複計算
  commonObj = {};
  majorObj = {};
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
  console.log(commonObj);
  console.log(majorObj);
}

// generate uuID without '-'
function uuid() {
  let id = Date.now();
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    id += performance.now(); //use high-precision timer if available
  }
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (id + Math.random() * 16) % 16 | 0;
    id = Math.floor(id / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function createHTMLFile() {
  // const download = document.querySelector("#download");
  // const test = document.querySelector('.test');
  let totalCredits = commonObj["總學分"];
  let str = "";
  str += `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="https://img.icons8.com/ios/344/test.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU" crossorigin="anonymous">
    <title>validation result</title>
  </head>
  <body>
  `;

  str += `
    <div class="container">
      <div class="row g-3">
  `;
  str += `
        <div class="col-12">
          <div class="card ${
            totalCredits.final ? "bg-success" : "bg-danger"
          } bg-opacity">
            <div class="card-body">
              <h5 class="card-title text-white font-weight-bold">總學分</h5>
              <h6 class="card-subtitle mb-2 text-white">${
                totalCredits.final ? "通過" : "未通過"
              }</h6>
              <h2 class="card-text bg-white p-3 rounded border-3">共 ${
                totalCredits.validation
              } 學分</h2>
            </div>
          </div>
        </div>
  `;
  delete commonObj["總學分"];
  Object.entries(commonObj).forEach((entry: any) => {
    let [key, value] = entry;
    str += `
        <div class="col-12">
          <div class="card ${
            value.final ? "bg-success" : "bg-danger"
          } bg-opacity">
            <div class="card-body">
              <h5 class="card-title text-white font-weight-bold">${key}</h5>
              <h6 class="card-subtitle mb-2 text-white">${
                value.final ? "通過" : "未通過"
              }</h6>
              <div class="accordion">
    `;
    value.validation.forEach((result: any) => {
      let id = uuid();
      str += `
                <div class="accordion-item">
                  <h2 class="accordion-header" id="Heading-${id}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#Collapse-${id}" aria-expanded="false" aria-controls="Collapse-${id}">
                      ${result.name} ${result.valid ? "通過" : "未通過"}
                    </button>
                  </h2>
                  <div id="Collapse-${id}" class="accordion-collapse collapse" aria-labelledby="Heading-${id}">
                    <div class="accordion-body">
                      <p class="accordion-text">共 ${result.credits} 學分</p>
                      <p class="accordion-text">已修 ${result.courses.toString()}</p>
                    </div>
                  </div>
                </div>
      `;
    });
    str += `
              </div>
            </div>
          </div>
        </div>
    `;
  });

  str += `
        <div class="col-12"></div>
  `;

  Object.entries(majorObj).forEach((entry: any) => {
    let [key, value] = entry;
    str += `
        <div class="col-12">
          <div class="card ${
            value.final ? "bg-success" : "bg-danger"
          } bg-opacity">
            <div class="card-body">
              <h5 class="card-title text-white font-weight-bold">${key}</h5>
              <h6 class="card-subtitle mb-2 text-white">${
                value.final ? "通過" : "未通過"
              }</h6>
              <ul class="list-group">
    `;

    Object.entries(value).forEach((termsEntry: any) => {
      let [term, termValue] = termsEntry;
      str += `
                <li class="list-group-item">
                  <p class="card-text">${term} ${
        termValue.final ? "通過" : "未通過"
      }</p>
                  <div class="accordion">
      `;
      termValue.validation.forEach((result: any) => {
        let id = uuid();
        str += `
                    <div class="accordion-item">
                      <h2 class="accordion-header" id="Heading-${id}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#Collapse-${id}" aria-expanded="false" aria-controls="Collapse-${id}">
                          ${result.name} ${result.valid ? "通過" : "未通過"}
                        </button>
                      </h2>
                      <div id="Collapse-${id}" class="accordion-collapse collapse" aria-labelledby="Heading-${id}">
                        <div class="accordion-body">
                          <p class="accordion-text">共 ${
                            result.credits
                          } 學分</p>
                          <p class="accordion-text">已修 ${result.courses.toString()}</p>
                        </div>
                      </div>
                    </div>
        `;
      });
      str += `
                  </div>
                </li>
      `;
    });
    str += `
            </ul>
          </div>
        </div>
      </div>
    `;
  });

  str += `
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-/bQdsTh/da6pkI1MST/rWKFNjaCP5gBSY4sEBT38Q/9RBh9AH40zEOg7Hlq2THRZ" crossorigin="anonymous"></script>
    </body>
  </html>`;

  return str;
}

function GradReviewer(rules: { [key: string]: any }) {
  const checkTable = React.useContext(CheckTableContext);
  const [HTMLFileGenerateState, setHTMLFileGenerateState] =
    React.useState("generate HTML file");
  const handleClick = () => {
    // console.log("checkTable: ", checkTable);
    validation(checkTable, rules);
    setHTMLFileGenerateState("done");
  };
  // download HTML file
  const downloadClick = (e: any) => {
    // console.log(e.target);
    console.log("download file");
    e.target.href =
      "data:text/html;charset=UTF-8," + encodeURIComponent(createHTMLFile());
    setHTMLFileGenerateState("reset to default");
  };

  return (
    <div>
      <button onClick={handleClick}>check</button>
      <a
        id="download"
        onClick={downloadClick}
        href="#download"
        download="validate.html"
        style={HTMLFileGenerateState === "done" ? {} : { display: "none" }}
      >
        Download
      </a>
    </div>
  );
}

export default GradReviewer;
