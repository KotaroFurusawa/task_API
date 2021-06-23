var TOKEN = "xxxxxxxxxxxxx";//アクセストークン（シークレット）
var URL = "https://api.line.me/v2/bot/message/reply";
var line_endpoint_profile = 'https://api.line.me/v2/bot/profile';
var command = {
    "start": "#start",
    "finish": "#finish",
    "contents": "todo",
    "done": "#done",
    "content": "-"
}

function doPost(event) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    var request = JSON.parse(event.postData.contents);
    var replyToken = request.events[0].replyToken;
    var userMessage = request.events[0].message.text;
    var time = request.events[0].timestamp;
    var userId = request.events[0].source.userId;

    var SpreadSheet = getSpreadSheet(userId, year, month);
    var lastRow = SpreadSheet.getLastRow();

    var lastType = fetchLastRow(SpreadSheet, lastRow, 2);
    var text = textAnalyse(userMessage, lastType, SpreadSheet, time, lastRow, userId);

    if (text[0] != null) {
        if (text[1] != 'stampTypeError') {
            writeSheet(time, SpreadSheet, text);
            if (text[0] == '終了') {
                let row = Number(lastRow) + 1;
                SpreadSheet.getActiveSheet().getRange(row, 5).setFontColor("red");
                var botMessage = `${getUserDisplayName(userId)}さん！\nお疲れ様！しっかりと休憩とってね！\n作業時間:${text[1]}\n今月の累計:${fetchLastRow(SpreadSheet, 3, 1)}\n${[SpreadSheet.getUrl()]}`;
            } else {
                var botMessage = `${getUserDisplayName(userId)}さん！\p(*＾-＾*)q 無理せずがんばれ♪\n${[SpreadSheet.getUrl()]}`;
            }
        } else {
            if (text[2] == 'finished') {
                var botMessage = getUserDisplayName(userId) + 'さん!\n前回のタスクが終了されていないため、新たなタスクを開始できません！\n下記URLから直接修正してください。\n' + [SpreadSheet.getUrl()];
            } else if (text[2] == 'started') {
                var botMessage = getUserDisplayName(userId) + 'さん!\nタスクの開始が確認されていないので、終了できません！\n下記URLから直接修正してください。\n' + [SpreadSheet.getUrl()];
            }
        }

        var payload = JSON.stringify({
            "replyToken": replyToken,
            "messages": [{
                "type": "text",
                "text": botMessage
            }]
        });
        UrlFetchApp.fetch(URL, {
            "headers": {
                "Content-Type": "application/json; charset=UTF-8",
                "Authorization": "Bearer " + TOKEN
            },
            "method": "post",
            "payload": payload
        });
    }
    return;
}

function writeSheet(time, sheet, text) {
    //スプレッドシートを更新
    var info = [];
    var dat = createDate(time);

    info.push(dat[0]);
    info.push(text[0]);
    info.push(dat[1]);
    info.push(text[1]);
    info.push(text[2]);

    sheet.appendRow(info);
    return;
}

function textAnalyse(userMessage, lastType, sheet, finish_time, lastRow, user_id) {
    //テキストからスプレッドシートに書き込む要素の抽出
    var textMemo = []
    if (userMessage.search(command.start) >= 0) {
        if (lastType != '開始') {
            textMemo.push('開始');
            textMemo.push('--------');
            textMemo.push(taskContents(userMessage));
            PropertiesService.getScriptProperties().setProperty(`${user_id}beforeType`, '開始');
        } else {
            return ['Error', 'stampTypeError', 'finished'];
        }
    } else if (userMessage.search(command.finish) >= 0) {
        if (lastType != '終了') {
            textMemo.push('終了');
            let task_duration = taskDuration(sheet, finish_time, lastRow);
            textMemo.push(task_duration.join(':'));
            textMemo.push(taskDone(userMessage));
            PropertiesService.getScriptProperties().setProperty(`${user_id}beforeType`, '終了');
            var cal_time = calTotalTime(sheet, task_duration);
            sheet.getRange("A3").setValue(cal_time.join("時間") + '分');
        } else {
            return ['Error', 'stampTypeError', 'started'];
        }
    } else {
        return [null, null, null];
    }

    return textMemo;
}

function taskContents(userMessage) {
    //タスク内容の抽出
    if (userMessage.search(command.contents) >= 0) {
        let content_text = listToArray(userMessage, 'contents');
        return content_text.join("\n");
    } else {
        return '';
    }
}

function taskDone(userMessage) {
    //終了タスクの抽出
    if (userMessage.search(command.done) >= 0) {
        let done_text = listToArray(userMessage, 'done');
        return done_text.join("\n");
    } else {
        return '';
    }
}

function listToArray(userMessage, type) {
    let contents = userMessage.split(command[type])[1].split('\n');
    var content_text = [];
    for (var key in contents) {
        if (contents[key].charAt(0) == command.content) {
            content_text.push(contents[key]);
        }
    }
    return content_text;
}

function calTotalTime(SpreadSheet, duration_time_set) {
    //累計学習時間の更新
    var totalTime = fetchLastRow(SpreadSheet, 3, 1);
    if (totalTime == '') {
        var total_date = [0, 0];
    } else {
        var total_date = String(totalTime).slice(0, -1).split('時間').reverse();
        //hourが表示されないとき用に逆転
        if (total_date.length == 1) {
            total_date.push('0');
        }
    }
    var hour = Number(total_date[1]) + Number(duration_time_set[0]);
    var min = Number(total_date[0]) + Number(duration_time_set[1]);
    var min_to_hour = parseInt(min / 60);
    hour += min_to_hour;
    min -= min_to_hour * 60;

    var total_hour_min = [];
    if (hour > 0) {
        total_hour_min.push(String(hour));
    }
    total_hour_min.push(String(min));

    return total_hour_min;
}

function taskDuration(SpreadSheet, finish_time, lastRow) {
    //タスク継続時間の計算
    var day = new Date(fetchLastRow(SpreadSheet, lastRow, 1));
    var start_time = new Date(fetchLastRow(SpreadSheet, lastRow, 3));

    //ここ，よくエラー起きるので対応策検討
    //var start_date = new Date(day.toLocaleDateString().split('/').reverse().join('/') + ' ' + start_time.toLocaleTimeString().split('.').join(':') );
    var start_date = new Date(day.toLocaleDateString() + ' ' + start_time.toLocaleTimeString());


    var duration_time = Number(finish_time) - Number(start_date.getTime());

    var hour = parseInt(duration_time / (1000 * 60 * 60));
    var min = parseInt((duration_time - hour * 1000 * 60 * 60) / (1000 * 60));
    if (min < 10) {
        min = `0${min}`;
    }
    var timeSet = [];
    timeSet.push(String(hour));
    timeSet.push(String(min));
    return timeSet;
}

function fetchLastRow(sheet, lastRow, col) {
    //前回の打刻種別を取得
    return sheet.getActiveSheet().getRange(lastRow, col).getValues();
}

function createDate(time) {
    //TimeStampから日付と時間を返す
    var dat = new Date(time);
    let min = dat.getMinutes();
    if (Number(min) < 10) {
        min = '0' + min;
    }
    var date = `${dat.getFullYear()}/${Number(dat.getMonth()) + 1}/${dat.getDate()}`;
    var d_time = `${dat.getHours()}:${min}`;
    return [date, d_time];
}

function getSpreadSheet(user_id, year, month) {
    //個人のスプレッドシート取得(ない場合は作成)

    var sid = PropertiesService.getScriptProperties().getProperty(`${user_id}${year}${month}`);
    if (sid == null) {
        let flag = PropertiesService.getScriptProperties().getProperty(`${user_id}beforeType`);
        if (flag == '開始') {
            if (month == 1) {
                year -= 1;
                month = 12;
            } else {
                month -= 1;
            }
            let before_sid = PropertiesService.getScriptProperties().getProperty(`${user_id}${year}${month}`);
            return SpreadsheetApp.openById(before_sid);
        } else {
            return createSpreadSheet(user_id, year, month);
        }
    } else {
        try {
            return SpreadsheetApp.openById(sid);
        } catch (e) {
            return createSpreadSheet(user_id, year, month);
        }
    }
}

function createSpreadSheet(user_id, year, month) {
    //個人のスプレッドシート新規作成
    var ori_sheet = SpreadsheetApp.openById('xxxxxx');//ベースとなるスプレッドシートid(シークレット)
    var spreadSheet = ori_sheet.copy(`${getUserDisplayName(user_id)}(${month}月${year}年)`);
    PropertiesService.getScriptProperties().setProperty(`${user_id}${year}${month}`, spreadSheet.getId());
    var file = DriveApp.getFileById(spreadSheet.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return spreadSheet;
}


function getUserDisplayName(user_id) {
    //LINEアカウントIDからアカウント名の取得
    var res = UrlFetchApp.fetch(line_endpoint_profile + '/' + user_id, {
        'headers': {
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + TOKEN,
        },
        'method': 'get',
    });
}
