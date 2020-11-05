<style lang="less" scoped>
.gob-main{
  position: relative;
  &:after{
    content: '';position: absolute;top:0;left: 0;width:100%;height: 100%;
    background:#00132b;z-index:-2;
  }
  &:before{
    content: '';position: absolute;top:0;left: 0;width:100%;height: 100%;
    background:url(../../../images/cloud-menu.png) center center repeat;z-index:-1;opacity: .1;
  }
  &-left{
    width: calc((100% - 1000px) / 2);float:left;display: flex;align-items: center;justify-content: center;
  }
  &-user{
    width: 40%;
    p{font-size:14px;color:#ffffff;text-shadow: 1px 1px 2px #000000;line-height: 25px;}
    p:nth-child(1),p:last-child{
      text-align: center;padding: 5px 0;
    }
    .current{border:solid 2px #ff0000;}
  }
  &-center{
    width:1000px;float:left;
  }
}
</style>
<template>
  <div class="gob-main base-cover">
    <div class="gob-main-left base-cover">
      <div class="gob-main-user">
        <p><a-avatar :class="isBlack?'current':''" shape="square" size="large" :src="userBlack.icon" /></p>
        <p>棋手：{{userBlack.name}}</p>
        <p>当前：{{isBlack?'先手':'等候对方落子'}}</p>
        <p>落子：{{userBlackLZ}}</p>
        <p>胜局：{{userBlack.success}}</p>
        <p>败局：{{userBlack.faild}}</p>
        <p><a-button  type="primary" size="small" @click="resetGobang" :disabled="!(issuccess||isBlack)">{{issuccess?'重开棋局':(isBlack?'主动认输':'对弈中...')}}</a-button></p>
      </div>
    </div>
    <div class="gob-main-center base-cover">
      <canvas class="base-cover" ref="gobangRef"></canvas>
    </div>
    <div class="gob-main-left base-cover">
      <div class="gob-main-user">
        <p><a-avatar :class="isBlack?'':'current'" shape="square" size="large" :src="userWhite.icon" /></p>
        <p>棋手：{{userWhite.name}}</p>
        <p>当前：{{isBlack?'等候对方落子':'先手'}}</p>
        <p>落子：{{userWhiteLZ}}</p>
        <p>胜局：{{userWhite.success}}</p>
        <p>败局：{{userWhite.faild}}</p>
        <p><a-button  type="primary" size="small" @click="resetGobang" :disabled="!(issuccess||!isBlack)">{{issuccess?'重开棋局':(!isBlack?'主动认输':'对弈中...')}}</a-button></p>
      </div>
    </div>
  </div>
</template>
<script>
import Gobang from './common/gobang.1.0.0';
export default {
  name:"gameGobang",
  data(){
    return {
      userBlack:{name:'黑棋大师',success:0,faild:0,icon:require('../../../images/userimg.jpg')},
      userWhite:{name:'白棋大师',success:0,faild:0,icon:require('../../../images/logo-min.png')},
      gobang:null,
      isBlack:true,
      issuccess:false,
      content:"进行中",
      infos:[],
      currentPiece:null
    };
  },
  mounted(){
    this.$nextTick(()=>{
      this.init();
    });
  },
  computed:{
    userBlackLZ(){
      if(this.gobang)return this.gobang.nodes.filter(f=>f.color=="#000000").length;
      return 0;
    },
    userWhiteLZ(){
      if(this.gobang)return this.gobang.nodes.filter(f=>f.color=="#ffffff").length;
      return 0;
    },
  },
  beforeDestroy(){
    this.gobang.dispose();
  },
  methods:{
    //初始化
    init(){
      this.gobang=new Gobang(this.$refs.gobangRef,{
        mosedownCallBack:this.mosedownCallBack
      });
    },
    //重开棋局
    resetGobang(){
      if(!this.issuccess){
        if(!this.isBlack){
          this.userBlack.success++;
          this.userWhite.faild++;
        }else{
          this.userBlack.faild++;
          this.userWhite.success++;
        }
      }
      this.issuccess=false;
      this.content="进行中";
      this.isBlack=true;
      this.infos=[];
      this.gobang.reset();
    },
    //鼠标在棋盘按下回调
    mosedownCallBack(e){
      if(this.issuccess)return;
      switch(e.code){
        case 0://信息
          this.infos.push(e.data);
          break;
        case 1://胜利
          this.content=(!this.isBlack?'黑棋':'白棋')+" 获得了胜利";
          e.data.push(this.currentPiece);
          let arr=this.$AGD.ArrStort(e.data,e.data.every(e=>e.x==this.currentPiece.x)?'y':"x",true);
          arr.forEach((f,i)=>{
            f.text=this.content[i+3];
          });
          if(!this.isBlack){
            this.userBlack.success++;
            this.userWhite.faild++;
          }else{
            this.userBlack.faild++;
            this.userWhite.success++;
          }
          this.isBlack=true;
          this.issuccess="true";
          break;
        case 2://添加棋子成功
          this.currentPiece=e.data;
          this.isBlack=!this.isBlack;
          break;
        case 3://添加棋子
          this.gobang.addPiece(e.data,this.isBlack?'#000000':'#ffffff');
          break;
        case -1://失败
          //
          break;
      }
    }
  }
}
</script>
