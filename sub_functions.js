
function data_extract(text, start, end) {
  var reg = new RegExp(start + '.*?' + end);
  var data = text.match(reg)[0]
    .replace(start, '')
    .replace(end, '');
  return data;
}


function processor(user_id, input){
  var id_row = t_db_content[0].indexOf(user_id)+2;
  if (id_row < 2){ //IDが見つからない
    if (input.match(/^[0-9]+$/)){
      var reply = "まず解析する文章を入力してください！";
    } else {
      sheet.getRange(last_row + 1, line_id_column, 1, 3).setValues([[user_id, "200", input]]);
      var reply = "解析する文章を登録しました！\n\n次に解析方法を選んで番号(半角数字)を入力してください！\n\n" + analysis_method_list;
    }
  } else { //すでにIDが登録されている
    user_status = Number(db_content[id_row-2][1])
    target_text = db_content[id_row-2][2]
    usage_count = Number(db_content[id_row-2][4])
    if (usage_count < daily_limit_count){
      if (input.match(/^[0-9]+$/) && user_status >= 200 && user_status < 400){ //解析手法入力
        if (user_status == 311){//要約文数
            var reply = cotoha_call(11, target_text, "", Number(input));
            sheet.getRange(id_row, status_id_column,1, 4).setValues([["200", target_text, "", usage_count + 1]]);//選択された手法での解析結果を返し、手法選択に戻す+カウント追加
        } else {
            analysis_method = Number(input);
            if (analysis_method == 5){ //比較対象文章を入力
              sheet.getRange(id_row, status_id_column).setValue("300");
              var reply = "「類似度算出」が選択されました！\n\n続けて比較する文章を入力してください！\n";
            } else if (analysis_method == 11){ //要約後文数を入力
              sheet.getRange(id_row, status_id_column).setValue("311");
              var reply = "「要約」が選択されました！\n\n続けて要約文数を半角数字で入力してください！\n";
            } else if (analysis_method >= 1 && analysis_method <= 10){
              var reply = cotoha_call(analysis_method, target_text, "", 1);
              sheet.getRange(id_row, usage_count_column).setValue(usage_count + 1);
            } else {
              var reply = "適切な番号(半角数字)を入力してください！";
            }
        }
      } else { //文章入力
        if(user_status == 200){
            var reply = "解析する文章を更新しました！\n\n次に解析方法を選んで番号(半角数字)を入力してください！\n\n" + analysis_method_list;
            sheet.getRange(id_row, input_1_column).setValue(input);
        } else if (user_status == 300){ //「類似度算出」
            var reply = cotoha_call(5, target_text, input, 1)
            sheet.getRange(id_row, status_id_column,1, 4).setValues([["200", target_text, input, usage_count + 1]]);//選択された手法での解析結果を返し、手法選択に戻す+カウント追加
        }
      }
    } else {
      var reply = 'たくさん使っていただきありがとうござます！\n１日の使用上限である' + daily_limit_count + '回を超えたため、また明日ご利用ください！';
    }
  }
  return reply
}



function getAccessToken(){
    // アクセストークン取得URL指定
    var url = access_token_publish_url;
    // ヘッダ指定
    const headers={
        "Content-Type": "application/json;charset=UTF-8"
    };
    // リクエストボディ指定
    var data = {
        "grantType": "client_credentials",
        "clientId": client_id,
        "clientSecret": client_secret
    };

    var options = {
      "method": "post",
      "payload": JSON.stringify(data),
      "headers": headers
    };

    try{
      var response = UrlFetchApp.fetch(url, options);
      var error = response.getResponseCode();
      var responseObj = JSON.parse(response);
      var reply = responseObj["access_token"];
    } catch(e) {
      var reply = "fetchに失敗しました。";
    }

    return reply
}


function cotoha_call(api_number, sentence_1, sentence_2, sent_len){
    // API URL指定
    var api_type = api_list[Number(api_number)];
    if (api_type == "parse"){
        var api_name = "構文解析";
        var base_url_footer = "v1/" + api_type;
        var request_body_type = 1;
    } else if (api_type == "ne"){
        var api_name = "固有表現抽出";
        var base_url_footer = "v1/" + api_type;
        var request_body_type = 1;
    } else if (api_type == "keyword"){
        var api_name = "キーワード抽出";
        var base_url_footer = "v1/" + api_type;
        var request_body_type = 2;
    } else if (api_type == "coref"){
        var api_name = "照応解析";
        var base_url_footer = "v1/coreference";
        var request_body_type = 2;
    } else if (api_type == "simi"){
        var api_name = "類似度算出";
        var base_url_footer = "v1/similarity";
        var request_body_type = 3;
    } else if (api_type == "sen_type"){
        var api_name = "文タイプ判定";
        var base_url_footer = "v1/sentence_type";
        var request_body_type = 1;
    } else if (api_type == "user_at"){
        var api_name = "ユーザ属性推定(β)";
        var base_url_footer = "beta/user_attribute";
        var request_body_type = 2;
    } else if (api_type == "filter"){
        var api_name = "言い淀み除去(β)";
        var base_url_footer = "beta/remove_filler";
        var request_body_type = 4;
    } else if (api_type == "detect"){
        var api_name = "音声認識誤り検知(β)";
        var base_url_footer = "beta/detect_misrecognition";
        var request_body_type = 1;
    } else if (api_type == "senti"){
        var api_name = "感情分析";
        var base_url_footer = "v1/sentiment";
        var request_body_type = 1;
    } else if (api_type == "summary"){
        var api_name = "要約(β、重要文抽出)";
        var base_url_footer = "beta/summary";
        var request_body_type = 5;
    } else {
    }

    var reply_header = "===>\n" + api_name + "\n===>";
    var url = developer_api_base_url + base_url_footer;

    // ヘッダ指定
    var headers={
        "Authorization": "Bearer " + getAccessToken(), //access_token,
        "Content-Type": "application/json;charset=UTF-8",
    };

    // リクエストボディ指定
    if (request_body_type == 1){
        var data = {
            "sentence": sentence_1
        };
    } else if (request_body_type == 2){
        var data = {
            "document": sentence_1
        };
    } else if (request_body_type == 3){
        var data = {
            "s1": sentence_1,
            "s2": sentence_2
        };
    } else if (request_body_type == 4){
        var data = {
            "text": sentence_1
        };
    } else if (request_body_type == 5){
        var data = {
            "document": sentence_1,
            "sent_len": sent_len
        };
    } else {
    }

    var options = {
      "method": "post",
      "payload": JSON.stringify(data),
      "headers": headers
    };
    try{
      var response = UrlFetchApp.fetch(url, options);
      var responseObj = JSON.parse(response);
      try{
        if (api_type == "parse"){
            var reply = parse_process(responseObj, api_name);
        } else if (api_type == "ne"){
            var reply = ne_process(responseObj, api_name);
        } else if (api_type == "keyword"){
            var reply = keyword_process(responseObj, api_name);
        } else if (api_type == "coref"){
            var reply = coref_process(responseObj, api_name);
        } else if (api_type == "simi"){
            var reply = simi_process(responseObj, api_name);
        } else if (api_type == "sen_type"){
            var reply = sen_type_process(responseObj, api_name);
        } else if (api_type == "user_at"){
            var reply = user_at_process(responseObj, api_name);
        } else if (api_type == "filter"){
            var reply = filter_process(responseObj, api_name);
        } else if (api_type == "detect"){
            var reply = detect_process(responseObj, api_name);
        } else if (api_type == "senti"){
            var reply = senti_process(responseObj, api_name);
        } else if (api_type == "summary"){
            var reply = summary_process(responseObj, api_name);
        } else {
            var reply = "Api Type Error.";
        }
      } catch(e){
        var reply = "結果解析処理に失敗しました。";
      }
      //var reply = responseObj ;
    } catch(e) {
      var reply = "Apiの呼び出しに失敗しました。";
    }
    return reply;

}


function parse_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n結果は\n「表記」\n(カナ読み / lemma / 品詞 / 副品詞)\nの形で出力されます！\n\n";
  } else {
    var final_output = "";
  }
  for (i = 0; i < Object.keys(output).length; i++) { //chunk(= token)数
    var tokens_data = output[i]["tokens"];
    for (j = 0; j < Object.keys(tokens_data).length; j++) {
      var final_output = final_output + tokens_data[j][parse_morph_list[0]] + "\n(";
      for (k = 1; k < parse_morph_list.length-1; k++) {
        var final_output = final_output + tokens_data[j][parse_morph_list[k]] + " / ";
      }
      var final_output = final_output + tokens_data[j][parse_morph_list[parse_morph_list.length-1]] + ")\n";
    }
  var final_output = final_output + '\n';
  }
  return final_output;
}


function ne_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n";
  } else {
    var final_output = "";
  }
  if (output.length < 1){
    var final_output = final_output + '固有表現は見つかりませんでした！';
  } else {
    var final_output = final_output + '結果は\n「表記」\n(標準表記 / 固有表現クラス / 拡張固有表現クラス)\nの形で出力されます！';
    for (i = 0; i < Object.keys(output).length; i++) { //chunk(= token)数
      var final_output = final_output + '\n\n' + output[i][ne_morph_list[0]] + "\n(";
      for (k = 1; k < ne_morph_list.length; k++) {
          if (k < ne_morph_list.length -1){
            if (JSON.stringify(output[i][ne_morph_list[k]]) == null){
              //var final_output = final_output + " - /";
            } else {
              var final_output = final_output + output[i][ne_morph_list[k]] + " / ";
            }
          } else {
            if (JSON.stringify(output[i][ne_morph_list[k]]) == null){
              var final_output = final_output + " )";
            } else {
              var final_output = final_output + output[i][ne_morph_list[k]] + ")";
            }
          }
      }

    }
  }
  return final_output;
}


function keyword_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n";
  } else {
    var final_output = "";
  }
  if (output.length < 1){
    var final_output = final_output + 'キーワードが見つかりませんでした！';
  } else {
    var final_output = final_output + '抽出されたキーワードは以下の通りです！\n';
    for (i = 0; i < Object.keys(output).length; i++) {
      var final_output = final_output + "\n" + output[i]["form"] + "\n(score = ";
      var final_output = final_output + Math.round(Number(JSON.stringify(output[i]["score"]))*10)/10 + ")\n";
    }
  }
  return final_output;
}


function coref_process(input_json_data, api_name){
  var output = input_json_data['result']['coreference'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n";
  } else {
    var final_output = "";
  }
  if (Object.keys(output).length == 0){
    var final_output = final_output + '照応関係が見つかりませんでした！'
  } else {
    var final_output = final_output + '検出された照応関係は以下の通りです！';
    for (i = 0; i < Object.keys(output).length; i++) {
      var ref_info = output[i]['referents'];
      for (j = 0; j < Object.keys(ref_info).length; j++) {
        if (j < Object.keys(ref_info).length - 1){
        var final_output = final_output + '\n\n' + JSON.stringify(ref_info[j]["form"]) + "\n=\n";
        } else {
          var final_output = final_output + JSON.stringify(ref_info[j]["form"]);
        }
      }
    }
  }
  return final_output;
}


function simi_process(input_json_data, api_name){
  var output = JSON.stringify(input_json_data['result']["score"]);
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n";
  } else {
    var final_output = "";
  }
  var final_output = final_output + "これらの文章の意味的類似度は\n" + Math.round(Number(output)*1000)/10 + '%\nです！';
  return final_output;
}


function sen_type_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n判定結果は以下の通りです！\n\n";
  } else {
    var final_output = "";
  }
  if (output["modality"] == 'declarative'){
    var par_modality = JSON.stringify(output["modality"]) + ' (叙述)\n';
  } else if (output["modality"] == 'interrogative'){
    var par_modality = JSON.stringify(output["modality"]) + ' (質問)\n';
  } else if (output["modality"] == 'imperative'){
    var par_modality = JSON.stringify(output["modality"]) + ' (命令)\n';
  } else {
    var par_modality = JSON.stringify(output["modality"]) + ' (不明)\n';
  }

  var par_dialog_act = "";
  for (i = 0; i < Object.keys(output["dialog_act"]).length; i++) {
    if (i < Object.keys(output["dialog_act"]).length -1) {
      var par_dialog_act = par_dialog_act + JSON.stringify(output["dialog_act"][i]) + ", ";
    } else {
      var par_dialog_act = par_dialog_act + JSON.stringify(output["dialog_act"][i]);
    }
  }
  var final_output = final_output + "文種＝\n" + par_modality + "\n発話行為種＝\n" + par_dialog_act;
  return final_output;
}


function user_at_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞";
  } else {
    var final_output = "";
  }
  var final_output = final_output + "\nこの文章を書いた人は、\n";
  for (i = 0; i < user_at_list.length; i++) {
    var extracted_data = JSON.stringify(output[user_at_list[i]]);
    var data_index = user_at_jp_list[i];
    if (extracted_data == null){
    } else {
      var final_output = final_output + '\n' + data_index + ' ＝ ' + extracted_data;
    }
  }
  return final_output + '\n\nっぽいです！';
}


function filter_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n除去結果は以下の通りです！\n";
  } else {
    var final_output = "";
  }
  for (i = 0; i < Object.keys(output).length; i++) {
    var extracted_data = output[i]["fixed_sentence"];
    var final_output = final_output + "\n" + extracted_data;
  }
  return final_output;
}


function detect_process(input_json_data, api_name){
  var output = input_json_data['result']["candidates"][0];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n";
  } else {
    var final_output = "";
  }
  if (output == null){
    var final_output = final_output + "誤り（の可能性がある）表現は検出されませんでした！";
  } else {
    var error_suggestion = output['form'];
    var candidates = output['correction']
    var final_output = final_output + "誤りの可能性がある表現は\n" + JSON.stringify(error_suggestion) + '\nです！\n\n修正候補はこちら\n→';

    for (i = 0; i < Object.keys(candidates).length; i++) {
      var each_candidate = candidates[i]['form'];
      var candidate_score = candidates[i]['correct_score'];
      var final_output = final_output + '\n候補' + (i + 1) + ' = ' + JSON.stringify(each_candidate) + " (" + Math.round(Number(candidate_score)*1000)/10 + "%)";
    }

  }
  return final_output;
}



function senti_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞";
  } else {
    var final_output = "";
  }
  var par_senti = output['sentiment'];
  var par_score = output['score'];
  var par_emo_phr = output['emotional_phrase'];
  var final_output = final_output + '\nこの文章の感情は\n' + par_senti + '\nです！\nセンチメントスコアは\n' +  Math.round(Number(par_score)*100)/100 + '\nになりました！' ;

  if (par_emo_phr == null){
  } else {
    if (par_emo_phr.length > 0){
      var final_output = final_output + '\n\n感情表現：'
      for (i = 0; i < par_emo_phr.length; i++) {
        var phr_form = par_emo_phr[i]['form'];
        var phr_emo = par_emo_phr[i]['emotion'];
        var final_output = final_output + '\n' + phr_form + '( = ' + phr_emo + ')';
      }
    } else {
    }
  }

  return final_output;
}


function summary_process(input_json_data, api_name){
  var output = input_json_data['result'];
  if (api_name_show_switch == 1){
    var final_output = "＜" + api_name + "＞\n";
  } else {
    var final_output = "";
  }
  var final_output = final_output + 'この文章の要約は、\n\n' + output + '\n\nです！';
  return final_output;
}


function Error_report(Error_content){
    var message = "すみません！\n" + Error_content + "が発生しました。\n\n対処を行いますので、今しばらくお待ちください。";
    return message
}
