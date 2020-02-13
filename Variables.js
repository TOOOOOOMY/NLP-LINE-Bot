//GAS変数
var ss = SpreadsheetApp.openById('???');
var sheet = ss.getSheetByName('???');
var last_row = sheet.getLastRow();
var date = new Date();
var date_column = 1;
var line_id_column = 2;
var status_id_column = 3;
var input_1_column = 4;
var input_2_column = 5;
var usage_count_column = 6;

var db_content = sheet.getRange(2, 2, last_row-1, 5).getValues();
var work_count = sheet.getRange(1, 1).getValue();

var row_col_trans = Underscore.load();
var t_db_content = row_col_trans.zip.apply(row_col_trans, db_content);

//LINE変数
var LINE_TOKEN = "???";
var maintenace =0; //メンテナンス・緊急対応実行時は1に変更


//COTOHA API変数
var daily_limit_count = 25;
var developer_api_base_url = "https://api.ce-cotoha.com/api/dev/nlp/"
var client_id = "???"
var client_secret = "???"
var access_token_publish_url = "https://api.ce-cotoha.com/v1/oauth/accesstokens"
var api_name_show_switch = 1; //api名を表示させたくない場合は0にする
var analysis_method_list = ' 1 = 構文解析,\n 2 = 固有表現抽出,\n 3 = キーワード抽出,\n 4 = 照応解析,\n 5 = 類似度算出,\n 6 = 文タイプ判定,\n 7 = ユーザ属性推定,\n 8 = 言い淀み除去,\n 9 = 音声認識誤り検知,\n10 = 感情分析,\n11 = 要約\n\n各項目の詳細に関してはこちら\nhttps://api.ce-cotoha.com/contents/api-all.html'

var api_list = ["NAN", "parse", "ne", "keyword", "coref", "simi", "sen_type", "user_at", "filter", "detect", "senti", "summary"];
var parse_morph_list = ["form", "kana", "lemma", "pos", 'features'];
var ne_morph_list = ["form", "std_form", "class", "extended_class", "info"];
var user_at_list = ['age', 'civilstatus', 'earnings', 'gender', 'habit', 'hobby', 'kind_of_business', 'kind_of_occupation', 'location', 'moving', 'occupation', 'position'];
var user_at_jp_list = ['年代', '既婚/未婚', '給与', '性別', '習慣', '趣味', '業種', '職種', '出身地', '移動手段', '職業', '役職']
