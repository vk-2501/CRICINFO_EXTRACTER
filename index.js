//The purpose of this prohject is to extract information of worldcup 2019 from cricinfo and present 
// that in the form of excel and pdf scorecards 
// the real purpose is to learn how to extract info and get experience with js

// npm inint -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib

//node index.js --excel=WorldCup.csv --dataFolder=data --source=" https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"

let minimist=require("minimist");
let axios=require("axios");
let jsdom=require("jsdom");
let path=require("path");
let excel=require("excel4node");
let pdf=require("pdf-lib");
let fs = require("fs");


let args=minimist(process.argv);
//THINGS TO ACHIEVE
// 1.Dowload using axios
// 2.Read using Jsdom
// 3.convert matches to teams
// 3.Make excel using excel4node
// 4.Make pdf using pdf-lib

// browser=>url to html( url se http request -> server ne html in https response)
let responsekapromise=axios.get(args.source);
responsekapromise.then(function(response){
    let html=response.data;
    let dom=new jsdom.JSDOM(html);
    let document=dom.window.document;
    let matches=[];
    let matchinfodiv=document.querySelectorAll("div .match-score-block");
    for(let i=0;i<matchinfodiv.length;i++){
      let  match={
          t1:"",
          t2:"",
          t1s:"",
          t2s:"",
          result:"",
          desc:""
         

        };
        let namesp=matchinfodiv[i].querySelectorAll("p.name");
        match.t1=namesp[0].textContent;
        match.t2=namesp[1].textContent;
     

        let scores=matchinfodiv[i].querySelectorAll("div.score-detail > span.score");
       if(scores.length==2){
            match.t1s=scores[0].textContent;
            match.t2s=scores[1].textContent;
       }
       else if(scores.length==1){
        match.t1s=scores[0].textContent;
        match.t2s="";
       }
       else{
        match.t1s="";
        match.t2s="";

       }

        let statuses=matchinfodiv[i].querySelectorAll("div .status-text > span");
        match.result=statuses[0].textContent;

        let date=matchinfodiv[i].querySelectorAll("div .match-info-FIXTURES >.description");
        match.desc=date[0].textContent;

        matches.push(match);

    }
    let matchesJSON=JSON.stringify(matches);
    fs.writeFileSync("matches.json",matchesJSON,"utf-8");
    let teams=[];
    for(let i=0;i<matches.length;i++){
        putifMissinginteams(teams,matches[i]);
        putmatches(teams,matches[i]);
    }
        let js=  JSON.stringify(teams);
        fs.writeFileSync("teams.json",js,"utf-8");

        createExcelfile(teams);
        createfolder(teams);
       

}).catch(function(err){
    console.log(err);
});

function putifMissinginteams(teams,match){
    let idx=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==match.t1){
            idx=i;
            break;
        }
    }

    if(idx==-1){
        let team={
            name:match.t1,
            matches:[]
        };
        teams.push(team);
    }

    let tidx=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==match.t2){
            tidx=i;
            break;
        }
    }

    if(tidx==-1){
        let team={
            name:match.t2,
            matches:[]
        };
        teams.push(team);
    }

}

function putmatches(teams,match){
    let idx=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==match.t1){
            idx=i;
            break;
        }
    }
    let team1=teams[idx];
    team1.matches.push({
        vs:match.t2,
        selfScore:match.t1s,
        oppScore:match.t2s,
        result:match.result,
        desc:match.desc
    });

    let tidx=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name==match.t2){
            tidx=i;
            break;
        }
    }
    let team2=teams[tidx];
    team2.matches.push({
        vs:match.t1,
        selfScore:match.t2s,
        oppScore:match.t1s,
        result:match.result,
        desc:match.desc
    });

}

function createExcelfile(teams){
    let wb = new excel.Workbook();
for(let i=0;i<teams.length;i++){
  let sheet=  wb.addWorksheet(teams[i].name);
  sheet.cell(1,1).string("vs");
  sheet.cell(1,2).string("SelfScore");
  sheet.cell(1,3).string("OppScore");
  sheet.cell(1,4).string("Result");
  sheet.cell(1,8).string("Description");




for(let j=0;j<teams[i].matches.length;j++){
    let vs=teams[i].matches[j].vs;
    let t1s=teams[i].matches[j].selfScore;
    let t2s=teams[i].matches[j].oppScore;
    let r=teams[i].matches[j].result;
    let desc=teams[i].matches[j].desc;
  
    sheet.cell(j+2,1).string(vs);
    sheet.cell(j+2,2).string(t1s);
    sheet.cell(j+2,3).string(t2s);
    sheet.cell(j+2,4).string(r);
    sheet.cell(j+2,8).string(desc);

}
}
wb.write(args.excel);

}

function createInflate(teamName , match,fin){
    let t1=teamName;
    let t2= match.vs;
    let t1s=match.selfScore;
    let t2s=match.oppScore;
    let res=match.result;
    let description=match.desc;
    let fullma= teamName + " vs " + t2;

    let pdfDoc=pdf.PDFDocument;
    let templatebytes=fs.readFileSync("Template.pdf");
    let templatebytesKapromise=pdfDoc.load(templatebytes);

    templatebytesKapromise.then(function(pdfdoc){
        let page=pdfdoc.getPage(0);
        page.drawText(fullma,{
            x:200,
            y:640,
            size:15

        });
        page.drawText(description,{
            x:100,
            y:600,
            size:15

        });

        page.drawText(t1,{
            x:80,
            y:496,
            size:15

        });

        page.drawText(t2,{
            x:217,
            y:496,
            size:15

        });
        page.drawText(t1s,{
            x:325,
            y:496,
            size:15

        });
        page.drawText(t2s,{
            x:450,
            y:496,
            size:15

        });
        page.drawText(res,{
            x:100,
            y:350,
            size:15

        });
    
        let promiseTosave=pdfdoc.save();
        promiseTosave.then(function (newbytes){
            fs.writeFileSync(fin,newbytes);
        });

    });
    
}

     function createfolder(teams){
        fs.mkdirSync(args.dataFolder);
        for(let i=0;i<teams.length;i++){
            let teamfol=path.join(args.dataFolder,teams[i].name);
            fs.mkdirSync(teamfol);
         for(let j=0;j<teams[i].matches.length;j++){
             let fin=path.join(teamfol,teams[i].matches[j].vs + ".pdf");
             
            createInflate(teams[i].name,teams[i].matches[j],fin);
         }
        }
    }