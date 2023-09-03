////////////
/// 一度私用だけを考える
/// クラス設計をシートごとにする．(???)
/// staticクラスの検討
/// git 管理を行う
/// 入力のバリデーションチェックを行う
/// 後から変更が起きた時の警告を出す．
/// b/s p/l g/lを作成する．
////////////
// リテラル
// チェックボックス, 選択ボタンetc生成の数
const cintInitRegisterAmount = 10;

// ユーザーへのメッセージを司る．
class clsMyMessage {
  
  constructor(strMode) {
    this.strModeDebug = "debug";
    this.strModeDeploy = "deploy";
    if(
      (strMode !== this.strModeDebug) && 
      (strMode !== this.strModeDeploy))
    {
      const strError = "your message mode is inappropriate -> " + strMode;
      Logger.log(strError);
      return;
    }
    this.strMode = strMode;
  }

  warning(strMessage) {
    switch(this.strMode){
      case this.strModeDebug:
        Logger.log("warn: " + strMessage);
        break;
      
      case this.strModeDeploy:
        Browser.msgBox("warn: " + strMessage);
        break;

      default:
        Logger.log("your message mode is not appropriate");
        break;

    }
  }
}

// メッセージクラスの作成
myMessage = new clsMyMessage("debug");

// 項目に関するクラス
class clsHeader {

  constructor(strHeader, intColumn, intRow) {
    this.strHeader = strHeader;
    this.intColumn = intColumn;
    this.intRow = intRow;
  }

}

// 転記するクラス
class clsPostArgs {
  constructor(str){

  }
}

// シート一覧
const objSheets = {
  strJournalEntry: "仕訳", 
  strLedger: "元帳", 
};

// 勘定科目一覧
const objAccounts = {
  objAssets: {
    cash: "現金", 
    bank: "預金口座", 
  }, 
  objLiabilities: {
    kaikake: "買掛金", 
  }, 
  objEquity: {
    shihonkin: "資本金", 
  }, 
  objExpense: {
    shiire: "仕入", 
  }, 
  objIncome: {
    sale: "売上", 
  }, 
};

class clsAccounts{

  constructor() {

  }

  getNumberOfAccounts() {
    return Object.values(objAccounts).length
  }
}

// 項目一覧
const objHeaders = {
  // ここに書いた項目はバリデーションチェックにも使われる．
  objJournalEntry: {
    headerPrivate: new clsHeader("私用", 1, 2),
    headerDate: new clsHeader("日付", 2, 2), 
    headerDebitAccount: new clsHeader("借方科目", 3, 2),  
    headerDebitAmount: new clsHeader("借方金額", 4, 2), 
    headerCreditAccount: new clsHeader("貸方科目", 5, 2), 
    headerCreditAmount: new clsHeader("貸方金額", 6, 2), 
    headerNote: new clsHeader("備考", 7, 2), 
    headerConfirm: new clsHeader("提出", 8, 2), 
  }, 
  // 横の長さを一個の勘定科目に対して換算している．(現在:length - 2 + 1)
  objLedge: {
    headerAccount: new clsHeader("not yet", 1, 1), 
    headerDebit: new clsHeader("借方", 2, 2), 
    headerDebitDate: new clsHeader("日付", 2, 3), 
    headerDebitCorrespondingAccount: new clsHeader("相手科目", 3, 3), 
    headerDebitAmount: new clsHeader("金額", 4, 3), 
    headerCredit: new clsHeader("貸方", 5, 2), 
    headerCreditDate: new clsHeader("日付", 5, 3), 
    headerCreditCorrespondingAccount: new clsHeader("相手科目", 6, 3), 
    headerCreditAmount: new clsHeader("金額", 7, 3), 
  }
};

class clsBasingSheets{

  constructor(){
    // 別にspreadsheetをプロパティにしてもいいけど後でやろう．
  }

  putSheetJournalEntry() {

    // 現在のスプレッドシートを取得
    const spreadsheetActive = SpreadsheetApp.getActiveSpreadsheet();
    // 仕訳のシートを取得
    const sheetJournalEntry = spreadsheetActive.getSheetByName(objSheets.strJournalEntry);

    // 項目を作成する．
    Object.keys(objHeaders.objJournalEntry).forEach((key) => {
      const header = objHeaders.objJournalEntry[key];
      sheetJournalEntry.getRange(header.intRow, header.intColumn).setValue(header.strHeader);
    });

    // チェックボックスを作成する
    sheetJournalEntry // シートの選択
    .getRange( // 範囲の選択
      objHeaders.objJournalEntry.headerConfirm.intRow + 1, 
      objHeaders.objJournalEntry.headerConfirm.intColumn, 
      cintInitRegisterAmount
    ).insertCheckboxes(); //チェックボックスの作成

    // バリデーションルールを作成
    let validationSelections = [];
    Object.values(objAccounts).map((value) => {
      validationSelections = validationSelections.concat(Object.values(value));
    })
    // Logger.log(validationSelections)
    const ruleValidation = SpreadsheetApp.newDataValidation().requireValueInList(
      validationSelections
      ).build();

    // 借方にルールを適用
    sheetJournalEntry
    .getRange(
      objHeaders.objJournalEntry.headerDebitAccount.intRow + 1, 
      objHeaders.objJournalEntry.headerDebitAccount.intColumn, 
      cintInitRegisterAmount
    ).setDataValidation(
      ruleValidation
    );

    // 貸方にルールを適用
    sheetJournalEntry
    .getRange(
      objHeaders.objJournalEntry.headerCreditAccount.intRow + 1, 
      objHeaders.objJournalEntry.headerCreditAccount.intColumn, 
      cintInitRegisterAmount
    ).setDataValidation(
      ruleValidation
    );
    /// 数値バリデーションも行いたい
    // const rule = SpreadsheetApp.newDataValidation().requireValueInList(Object.values(objAccounts.objCredits)).build();
    // cellActive.setDataValidation(rule);
  }

  // appendスタイル
  appendSheetLedge() {
    // 現在のスプレッドシートを取得
    const spreadsheetActive = SpreadsheetApp.getActiveSpreadsheet();
    // 元帳のシートを取得
    const sheetLedge = spreadsheetActive.getSheetByName(objSheets.strLedger);

    // 既に存在する勘定科目を探索
    const arrAccountExists = sheetLedge.getRange(
      objHeaders.objLedge.headerAccount.intRow, 
      objHeaders.objLedge.headerAccount.intColumn, 
      1, 
      sheetLedge.getLastColumn(), 
    ).getValues() //値が書かれている横まで取得する．
    [0] // 一行目を取得する．
    .filter(Boolean); // 何も書かれていないところを除外する．
    // Logger.log(objHeaders.objLedge.headerAccount.intRow)
    // Logger.log(sheetLedge.getLastColumn())
    // Logger.log(arrAccountExists);
    Logger.log(intPeriodAccount)
    /// 項目を作成する．
    let intAccountCounter = arrAccountExists.length;
    // 5要素ごとにループ
    Object.values(objAccounts).forEach((valueI) => {
      // 要素の中の勘定科目を取得
      Object.values(valueI).forEach((valueJ) => {
        // 項目ごとの横の感覚を計算する．
        const intPeriodAccount = intAccountCounter*(Object.keys(objHeaders.objLedge).length + 1 - 2);

        // 既にその勘定科目があるかどうかを検索する．
        if(arrAccountExists.includes(valueJ)){
          myMessage.warning("this Account already exists! -> " + valueJ)
          return;
        };

        // 横の列を増やす．
        sheetLedge.insertColumnsAfter(sheetLedge.getLastColumn(), (Object.keys(objHeaders.objLedge).length + 1 - 2));

        // 項目を書き込む
        Object.keys(objHeaders.objLedge).forEach((key) => {
          sheetLedge.getRange(
            objHeaders.objLedge[key].intRow, 
            objHeaders.objLedge[key].intColumn + intPeriodAccount
          ).setValue(objHeaders.objLedge[key].strHeader);
        });

        // 勘定科目を項目に対して部分的に上書きする．
        sheetLedge.getRange(
          objHeaders.objLedge.headerAccount.intRow, 
          objHeaders.objLedge.headerAccount.intColumn + intPeriodAccount
          ).setValue(valueJ);

        // 勘定科目の数を増加
        intAccountCounter++;
      })
    })
    // Object.keys(objHeaders.objJournalEntry).forEach((key) => {
    //   const header = objHeaders.objJournalEntry[key];
    //   sheetJournalEntry.getRange(header.intRow, header.intColumn).setValue(header.strHeader);
    // });
  }
}
// ベースとなるシートを作成する．
function initSheet() {
  basingSheets = new clsBasingSheets();
  basingSheets.putSheetJournalEntry();
  basingSheets.appendSheetLedge();
}

function onEdit() {

  // 現在のスプレッドシートを取得
  const spreadsheetActive = SpreadsheetApp.getActiveSpreadsheet();
  // 現在のシートを取得
  const sheetActive = spreadsheetActive.getActiveSheet();
  // 現在のセルを取得
  const cellActive = sheetActive.getActiveCell();
  // 現在の行を取得
  const intRowActive = cellActive.getRow();

  // activeCellが1, 1になっているバグのエラーを出力する．
  if((cellActive.getRow() === 1) && (cellActive.getColumn() === 1))
  {
    myMessage.warning("may be [CELL ACTIVE] is not working");
  }

  // 仕訳じゃない時はブレークする．
  if(sheetActive.getName() !== objSheets.strJournalEntry)
  {
    myMessage.warning("your sheet name->" + sheetActive.getName());
    return;
  }

  // 提出セルでなければブレークする．
  if(cellActive.getColumn() !== objHeaders.objJournalEntry.headerConfirm.intColumn)
  {
    myMessage.warning("your cell column -> " + cellActive.getColumn());
    return;
  }
  // 提出がtrueでなければブレークする．
  if(cellActive.getValue() !== true)
  {
    myMessage.warning("your cell value -> " + cellActive.getValue());
    return;
  }

  // 列を全てdisable背景に変更する．
  Object.values(objHeaders.objJournalEntry).forEach((value) => {
    sheetActive.getRange(intRowActive, value.intColumn).setBackground("#bdbdbd");
  })
  

  
  //  シートの選択
  // Logger.log(cellActive.getValue());
  // Logger.log(cellActive.getRow());
  // Logger.log(cellActive.getColumn());

  // Logger.log("success");
}

class clsLedger
{


  constructor() {
    // 一つの科目に対する横の長さ
    self.intLedgerLength = 8;

    // 現在のスプレッドシートを取得
    self.spreadsheetActive = SpreadsheetApp.getActiveSpreadsheet();
    // 仕訳のシートを取得
    self.sheetLedger = spreadsheetActive.getSheetByName(objSheets.strLedger);

  }

  getAccountIndex(strAccount) {
    accounts = clsAccounts();
    for(let i = 0; i < (accounts.getNumberOfAccounts*self.intLedgerLength); i++){

    }
  }
}

function funcPost2ledger(objTransaction) {

}

