/*
LINEから送信されたデータをメイン処理する
———————————–*/
function doPost(e) {
  /* レスポンスを取得 */
  const responseLine = e.postData.getDataAsString();
  /* JSON形式に変換する */
  const responseLineJson = JSON.parse(responseLine).events[0];
  /* イベントへの応答に使用するトークンを取得 */
  const replyToken = responseLineJson.replyToken;

  var json = JSON.parse(e.postData.contents);
  //user_idの取得、var宣言をしなければグローバル化
  LINE_user_id = json.events[0].source.userId;

  /*– メッセージイベントの場合 ———————–*/
  if (responseLineJson.type == 'message') {
    messageController(responseLineJson, replyToken);
  }
}


/*
メッセージイベントの処理
———————————–*/
function messageController(events, replyToken) {
  const message = events.message;
  const input = message.text;
  var text = input;//.replace(/\r?\n/g, '');
  if (maintenace == 0){
    if (text.match(/^[0-9]+$/) || text.match(/^[ぁ-んァ-ン一-龥]/)){
      var content = processor(LINE_user_id, text);
    } else {
      var content = "日本語か半角数字を入力してください！";
    }
  } else {
  //メンテナンス実行時
    var content = "大変申し訳ありません。\nただ今メンテナンス中です。\n\n完了までしばらくお待ちください。"
  }

  var LineMessageObject = [{
      'type': 'text',
      'text': content
  }];

  replyLine(LineMessageObject, replyToken);
}

/*
LINEに返信する処理
———————————–*/
function replyLine(LineMessageObject, replyToken) {
    const replyHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_TOKEN
    };

    const replyBody = {
        'replyToken': replyToken,
        'messages': LineMessageObject
    };

    const replyOptions = {
        'method': 'POST',
        'headers': replyHeaders,
        'payload': JSON.stringify(replyBody)
    };

    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', replyOptions);
}
