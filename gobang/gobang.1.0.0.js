import AGD from "../../../../libs/app.guard";
var requestAnimationFrame=window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function (fun) { setTimeout(fun, 1E3 / 60); };
//创建画布dom节点
function createCanvasElement(obj) {
  if (({}).toString.call(obj) === "[object HTMLCanvasElement]") {
    this.gobang = obj;
  } else if (obj instanceof HTMLElement) {
    var _gobang = document.createElement("canvas");
    obj.appendChild(_gobang);
    this.gobang = _gobang;
  } else if (typeof (obj) === "string") {
    var _obj = document.getElementById(obj);
    createCanvasElement.bind(this)(_obj);
  }
}
function Piece(){
  this.id="piece_id_"+(Math.ceil(Math.random()*100000000));
  this._x=0;
  this._y=0;
  this._size=10;

  this.color="#ffffff";
  this.isCurrent=false;
  this.text="";
}
Piece.prototype={
  constructor: Piece,
}
Object.defineProperties(Piece.prototype,{
  x:{
    get:function(){return this._x;},
    set:function(value){this._x=value;}
  },
  y:{
    get:function(){return this._y;},
    set:function(value){this._y=value;}
  },
  size:{
    get:function(){return this._size;},
    set:function(value){this._size=value;}
  }
});
function Gobang(ele,params){
  createCanvasElement.call(this,ele);
  if(this.gobang){
    this.parent=this.gobang.parentNode;
    this.gobang.setAttribute("width",this.parent.clientWidth);
    this.gobang.setAttribute("height",this.parent.clientHeight);
    this.ctx=this.gobang.getContext("2d");
    this.size={width:this.parent.clientWidth,height:this.parent.clientHeight};
    this.prevPiece=null;//上一子
    this.line=40;
    this.nodes=[];
    this.animations=[];
    this.board=Math.min(this.size.width,this.size.height);
    this.count=Math.floor((this.board-this.line)/this.line);
    this.offset={x:(this.size.width-this.board)/2,y:(this.size.height-this.board)/2};
    this.padding=(this.board-this.count*this.line)/2;

    this.isDispose=false;
    this.mosedownCallBack=function(){};
    for(let p in params)this[p]=params[p];
    this.init();
    return this;
  }
}
//判断横纵算法
function judgeCalcAB(nodes,point,xy){
  let judge={a:true,b:true,index:0,arr:[],obj:{}};
  nodes.forEach(f=>{judge.obj[f[xy]]=f;});
  while(judge.a||judge.b){
    judge.index++;
    if(judge.b&&judge.obj[point[xy]+judge.index]){
      judge.arr.push(judge.obj[point[xy]+judge.index]);
    }else judge.b=false;

    if(judge.a&&judge.obj[point[xy]-judge.index]){
      judge.arr.push(judge.obj[point[xy]-judge.index]);
    }else judge.a=false;
    if(judge.arr.length>=4){
      judge.a=false;
      judge.b=false;
    }
  }
  return judge.arr;
}
//判断斜向算法
function judgeCalc(nodes,point,isreverse){
  let judge={a:true,b:true,index:0,arr:[],obj:{}},name;
  nodes.forEach(f=>{judge.obj[f.x+'-'+f.y]=f;});
  while(judge.a||judge.b){
    judge.index++;
    name=isreverse==true?(point.x+judge.index)+'-'+(point.y-judge.index):(point.x+judge.index)+'-'+(point.y+judge.index);
    if(judge.b&&judge.obj[name]){
      judge.arr.push(judge.obj[name]);
    }else judge.b=false;

    name=isreverse==true?(point.x-judge.index)+'-'+(point.y+judge.index):(point.x-judge.index)+'-'+(point.y-judge.index);
    if(judge.a&&judge.obj[name]){
      judge.arr.push(judge.obj[name]);
    }else judge.a=false;
    if(judge.arr.length>=4){
      judge.a=false;
      judge.b=false;
    }
  }
  return judge.arr;
}
//绘制棋子
function drawPiece(g,nodes,line,offset,padding){
  let node;
  for(let i=0;i<nodes.length;i++){
    node=nodes[i];
    g.save();
    g.shadowBlur=5;
    g.shadowOffsetX=0;
    g.shadowOffsetY=0;
    g.shadowColor="black";
    g.beginPath();
    g.fillStyle = node.color;//node.isCurrent?'':
    g.arc(node.x*line+offset.x+padding, node.y*line+offset.y+padding, node.size, 0, Math.PI * 2);
    g.fill();
    if(node.isCurrent){
      g.lineWidth = 1;
      g.strokeStyle = "#00ff00";
      g.stroke();
    }
    g.restore();
    if(node.text){
      g.font="12px 微软雅黑";
      g.textAlign="center";
      g.textBaseline="middle";
      g.fillStyle = node.color=='#ffffff'?'#000000':'#ffffff';
      g.fillText(node.text, (node.x*line+offset.x)+padding, (node.y*line+offset.y)+padding);
    }
  }
}
//落棋动画
function pieceAnimation(g,nodes,line,offset,padding,piece){
  let current;
  g.save();
  for(let i=0;i<nodes.length;i++){
    current=nodes[i];
    if(current.size>=current.maxSize){
      if(piece&&piece.id==current.p.id){
        current.size=current.p.size;
        current.opacity=1;
      }else{
        nodes.splice(i,1);
        i--;
        continue;
      }
    }
    current.size+=current.sizeOffset;
    current.opacity-=current.opacityOffset;
    g.beginPath();
    g.strokeStyle = current.color=="#000000"?"rgba(0,0,0,"+current.opacity+")":"rgba(255,255,255,"+current.opacity+")";
    g.arc(current.x*line+offset.x+padding, current.y*line+offset.y+padding, current.size, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
}
Gobang.prototype={
  constructor: Gobang,
  //初始化
  init(){
    let gb=this,point;
    requestAnimationFrame(this.drawBg.bind(this));
    AGD.addEvent(this.gobang,"[game-gobang]mousedown",(e)=>{
      point=AGD.getElementPos(gb.gobang);
      gb.toPiecePoint({x:e.pageX-point.x,y:e.pageY-point.y});
    });
  },
  //转换棋子坐标
  toPiecePoint(point){
    let size=this.size,
    line=this.line,
    offset=this.offset,
    padding=this.padding;
    point.x=point.x-offset.x-padding;
    point.y=point.y-offset.y-padding;

    let surx=(point.x%line)/line,sury=(point.y%line)/line;
    if((surx<=0.25&&sury<=0.25)|| (surx>=0.75&&sury>=0.75)||
    (surx>=0.75&&sury<=0.25)||(surx<=0.25&&sury>=0.75)){
      //计算位置
      this.mosedownCallBack({code:3,data:{x:Math.round(point.x/line),y:Math.round(point.y/line)}});
    }
  },
  //添加棋子
  addPiece(point,color){
    if(!this.isExist(point)){
      if(this.prevPiece)this.prevPiece.isCurrent=false;
      let piece=new Piece();
      piece.x=point.x;
      piece.y=point.y;
      piece.color=color;
      piece.isCurrent=true,
      this.prevPiece=piece;
      this.nodes.push(piece);
      //动画
      this.animations.push({
        p:piece,
        color:color,
        x:point.x,
        y:point.y,
        size:piece.size,
        sizeOffset:.2,
        maxSize:piece.size+piece.size,
        opacity:1,
        opacityOffset:.2/(piece.size)
      });
      this.mosedownCallBack({code:2,data:piece});
      //判断是否获胜
      if(this.nodes.length>=8){
        let nodes=this.nodes.filter(f=>f.color==color),_nodes,judge;
        if(nodes.length>=4){
          //横向
          if((_nodes=nodes.filter(f=>f.y==point.y)).length>4){
            judge=judgeCalcAB(_nodes,point,'x');
            if(judge.length>=4)return this.mosedownCallBack({code:1,data:judge});
          }
          //纵向
          if((_nodes=nodes.filter(f=>f.x==point.x)).length>4){
            judge=judgeCalcAB(_nodes,point,'y');
            if(judge.length>=4)return this.mosedownCallBack({code:1,data:judge});
          }
          //斜向
          judge=judgeCalc(nodes,point);
          if(judge.length>=4)return this.mosedownCallBack({code:1,data:judge});
          judge=judgeCalc(nodes,point,true);
          if(judge.length>=4)return this.mosedownCallBack({code:1,data:judge});
        }
      }
    }
    this.mosedownCallBack({code:-1,data:"该位置存在棋子"});
  },
  //判断位置上是否存在
  isExist(point){
    return this.nodes.some(s=>s.x==point.x&&s.y==point.y);
  },
  //绘制背景
  drawBg(){
    if(this.isDispose)return;
    let g=this.ctx,
    size=this.size,
    board=this.board,
    line=this.line,
    offset=this.offset,
    count=this.count,
    padding=this.padding;
    //获取长宽最小
    g.clearRect(0,0,size.width,size.height);
    g.fillStyle="#fbbf6b";
    g.fillRect(offset.x,offset.y,board,board);
    g.lineWidth = 1;
    g.strokeRect(offset.x+padding,offset.y+padding,board-padding*2,board-padding*2);

    let str="五子棋",h=size.height/3;
    g.font=Math.floor(h/2)+"px 楷体";
    g.textAlign="center";
    g.textBaseline="middle";
    g.fillStyle = 'rgba(0,0,0,.1)';
    for(let i=0;i<str.length;i++){
      g.fillText(str[i], size.width/2, h/2+i*h);
    }

    g.beginPath();
    g.strokeStyle="#333333";
    for(let i=0;i<count;i++){
      g.moveTo(offset.x+padding,offset.y+line+(i*line)+padding);
      g.lineTo(offset.x+board-padding,offset.y+line+(i*line)+padding);
    }
    for(let i=0;i<count;i++){
      g.moveTo(offset.x+line+(i*line)+padding,offset.y+padding);
      g.lineTo(offset.x+line+(i*line)+padding,offset.y+board-padding);
    }
    g.stroke();
    drawPiece(g,this.nodes,line,offset,padding);
    pieceAnimation(g,this.animations,line,offset,padding,this.prevPiece);
    requestAnimationFrame(this.drawBg.bind(this));
  },
  //绘制背景
  drawBg1(){
    if(this.isDispose)return;
    let g=this.ctx,
    size=this.size,
    board=this.checkerboard,
    line=this.line,
    offset={x:(size.width-board.width)/2,y:(size.height-board.height)/2};
    //横向
    g.fillStyle="#fbbf6b";
    g.fillRect(offset.x,offset.y,board.width,board.height);
    g.lineWidth = 1;
    g.strokeRect(offset.x,offset.y,board.width,board.height);
    g.beginPath();
    g.lineWidth = 1;
    for(let i=0;i<board.height/line;i++){
      g.moveTo(offset.x,offset.y+line+(i*line));
      g.lineTo(offset.x+board.width,offset.y+line+(i*line));
    }
    g.strokeStyle="#333333";
    for(let i=0;i<board.width/line;i++){
      g.moveTo(offset.x+line+(i*line),offset.y);
      g.lineTo(offset.x+line+(i*line),offset.y+board.height);
    }
    g.stroke();
    drawPiece(g,this.nodes,line,offset);
    requestAnimationFrame(this.drawBg.bind(this));
  },
  //重置
  reset(){
    this.gobang.setAttribute("width",this.parent.clientWidth);
    this.gobang.setAttribute("height",this.parent.clientHeight);
    this.ctx=this.gobang.getContext("2d");
    this.size={width:this.parent.clientWidth,height:this.parent.clientHeight};
    this.prevPiece=null;
    this.line=40;
    this.nodes=[];
    this.animations=[];
    this.board=Math.min(this.size.width,this.size.height);
    this.count=Math.floor((this.board-this.line)/this.line);
    this.offset={x:(this.size.width-this.board)/2,y:(this.size.height-this.board)/2};
    this.padding=(this.board-this.count*this.line)/2;
  },
  //释放资源
  dispose(){
    this.isDispose=true;
    AGD.removeEvent(this.gobang,"[game-gobang]mousedown");
  }
};
export default Gobang;
