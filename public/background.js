/* eslint-disable no-undef */
// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


// eslint-disable-next-line no-restricted-globals
self.importScripts("firebase-app-compat.js", "firebase-database-compat.js");

chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {
                    hostSuffix: 'ncu.edu.tw',
                    pathContains: '/system/162'
                },
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        console.log("Message received by firebase background script");
        // eslint-disable-next-line no-restricted-globals
        // loadScript("../node_modules/firebase/firebase-database.js");
        let rules;
        const firebaseConfig = {
            apiKey: "AIzaSyCbIdg1a_ZIvB9zbv_r3MNVwWGBj7Lp8XE",
            authDomain: "ipeecs-gradreviewer.firebaseapp.com",
            databaseURL: "https://ipeecs-gradreviewer-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "ipeecs-gradreviewer",
            storageBucket: "ipeecs-gradreviewer.appspot.com",
            messagingSenderId: "648476820901",
            appId: "1:648476820901:web:68be500214bacc27d7944c",
            measurementId: "G-Y89HNZVCQY"
        };
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized", firebase);
        const db = firebase.database();
        const dbRef = db.ref();
    
        
        if (request.action === "fetchGradeReviewRule") {
            dbRef.child(request.ruleYear).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    rules = snapshot.val();
                    console.log(rules);
                } else {
                    console.log("No data available");
                }
                sendResponse(rules);
            }, (error) => {
                console.log(error);
            });
            
        }
        
    
    
    } catch (error) {
        console.log(error);
    }
    return true;
});
