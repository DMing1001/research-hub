/* ============================================================
   Research Hub · app.js
   研究生学术成果与投稿管理台 — 纯前端 / localStorage / JSON 备份
   ============================================================ */
'use strict';

/* ---------------- 常量：类型 / 状态流水线 / 表单字段 ---------------- */

const LS_KEY = 'research-hub.v1';

const RANK = {
  paper:    ['第一作者','第二作者','第三作者','第四作者','通讯作者','其他'],
  thesis:   ['独立完成','主要执笔','参与撰写'],
  patent:   ['第一发明人','第二发明人','第三发明人','第四发明人','其他'],
  copyright:['第一著作权人','第二著作权人','第三著作权人','其他'],
  software: ['独立开发','主要开发','核心贡献','参与开发']
};

const PARTITION = ['JCR Q1','JCR Q2','JCR Q3','JCR Q4','中科院1区','中科院2区','中科院3区','中科院4区',
                   'EI 收录','SCI 收录','CCF-A','CCF-B','CCF-C','中文核心','科技核心','普刊','国际会议','国内会议','其他'];

const ROWCOLS = {
  chapters: [
    {k:'name',  l:'章节',       w:'32%'},
    {k:'status',l:'状态',       w:'20%', t:'select', opts:['未开始','资料准备','撰写中','初稿','修改中','定稿']},
    {k:'words', l:'现有字数',   w:'18%', t:'number'},
    {k:'target',l:'目标字数',   w:'18%', t:'number'}
  ],
  milestones: [
    {k:'name',  l:'节点',       w:'34%'},
    {k:'date',  l:'日期',       w:'24%', t:'date'},
    {k:'status',l:'状态',       w:'30%', t:'select', opts:['未开始','准备中','已完成','延期']}
  ],
  materials: [
    {k:'name',  l:'资料名称',   w:'36%'},
    {k:'url',   l:'链接 / 路径', w:'52%'}
  ]
};

const TYPES = {
  paper: {
    label:'小论文', en:'PAPER', unit:'篇', idx:'02',
    statuses:[
      {k:'idea',n:'构思'},{k:'writing',n:'写作中'},{k:'ready',n:'待投稿'},
      {k:'submitted',n:'已投稿'},{k:'review',n:'审稿中'},
      {k:'major',n:'大修',warn:true},{k:'minor',n:'小修',warn:true},
      {k:'accepted',n:'录用',done:true},{k:'published',n:'见刊',done:true}
    ],
    fields:[
      {k:'title',l:'论文标题',t:'text',req:1,full:1},
      {k:'titleEn',l:'英文标题',t:'text',full:1},
      {k:'authors',l:'作者列表',t:'text',full:1,hint:'按原文顺序，通讯作者可加 *，例：张三, 李四, 王五*'},
      {k:'authorsEn',l:'作者列表（英文）',t:'text',full:1,hint:'例：S. Zhang, S. Li, W. Wang'},
      {k:'myRank',l:'我的排名',t:'select',opts:RANK.paper},
      {k:'contribution',l:'贡献说明',t:'textarea',full:1,hint:'例：提出方法 / 完成实验 / 撰写全文 —— 面试常问'},
      {k:'venue',l:'期刊 / 会议名称',t:'text'},
      {k:'venueAbbr',l:'简称',t:'text'},
      {k:'venueEn',l:'刊名（英文）',t:'text'},
      {k:'partition',l:'分区 / 等级',t:'select',opts:PARTITION},
      {k:'ifVal',l:'影响因子 IF',t:'number',step:'0.001'},
      {k:'year',l:'年份',t:'number'},
      {k:'vol',l:'卷(期): 页码',t:'text',hint:'例：57(3): 45-56'},
      {k:'doi',l:'DOI',t:'text',full:1},
      {k:'submitDate',l:'投稿日期',t:'date'},
      {k:'acceptDate',l:'录用日期',t:'date'},
      {k:'publishDate',l:'见刊日期',t:'date'},
      {k:'kw',l:'关键词',t:'text',full:1},
      {k:'nextAction',l:'下一步',t:'text',full:1,hint:'例：补齐图表 / 回复审稿意见 / 交说明书'},
      {k:'planDate',l:'计划完成日',t:'date'},
      {k:'note',l:'备注',t:'textarea',full:1},
      {k:'materials',l:'相关资料（初稿 / 修回稿 / 录用通知 / PDF）',t:'rows',full:1}
    ]
  },

  thesis: {
    label:'大论文', en:'THESIS', unit:'部', idx:'03',
    statuses:[
      {k:'topic',n:'选题'},{k:'proposal',n:'开题'},{k:'writing',n:'撰写中'},
      {k:'midterm',n:'中期'},{k:'predef',n:'预答辩'},{k:'blind',n:'盲审'},
      {k:'defended',n:'答辩通过',done:true},{k:'final',n:'终稿归档',done:true}
    ],
    fields:[
      {k:'title',l:'论文题目',t:'text',req:1,full:1},
      {k:'titleEn',l:'英文题目',t:'text',full:1},
      {k:'school',l:'培养单位',t:'text'},
      {k:'degree',l:'学位',t:'select',opts:['硕士','博士']},
      {k:'major',l:'专业',t:'text'},
      {k:'advisor',l:'导师',t:'text'},
      {k:'year',l:'预计答辩年份',t:'number'},
      {k:'chapters',l:'章节进度',t:'rows',full:1},
      {k:'milestones',l:'关键节点',t:'rows',full:1},
      {k:'nextAction',l:'下一步',t:'text',full:1,hint:'例：补齐图表 / 回复审稿意见 / 交说明书'},
      {k:'planDate',l:'计划完成日',t:'date'},
      {k:'note',l:'备注',t:'textarea',full:1},
      {k:'materials',l:'相关资料（开题报告 / 初稿 / 盲审意见）',t:'rows',full:1}
    ]
  },

  patent: {
    label:'专利', en:'PATENT', unit:'项', idx:'04',
    statuses:[
      {k:'idea',n:'创意'},{k:'brief',n:'交底书'},{k:'drafting',n:'撰写中'},
      {k:'filed',n:'已提交'},{k:'accepted',n:'受理'},{k:'prelim',n:'初审'},
      {k:'subst',n:'实质审查',warn:true},{k:'granted',n:'已授权',done:true},
      {k:'maintained',n:'维持有效',done:true}
    ],
    fields:[
      {k:'title',l:'专利名称',t:'text',req:1,full:1},
      {k:'titleEn',l:'英文名称',t:'text',full:1},
      {k:'patentType',l:'专利类型',t:'select',opts:['发明专利','实用新型','外观设计','PCT 国际申请']},
      {k:'applicationNo',l:'申请号',t:'text'},
      {k:'pubNo',l:'公开号',t:'text'},
      {k:'grantNo',l:'专利号（授权后）',t:'text'},
      {k:'applicants',l:'申请人 / 专利权人',t:'text',full:1},
      {k:'inventors',l:'发明人（按顺序）',t:'text',full:1},
      {k:'myRank',l:'我的排名',t:'select',opts:RANK.patent},
      {k:'filingDate',l:'申请日',t:'date'},
      {k:'pubDate',l:'公开日',t:'date'},
      {k:'grantDate',l:'授权公告日',t:'date'},
      {k:'agency',l:'代理机构',t:'text'},
      {k:'nextAction',l:'下一步',t:'text',full:1,hint:'例：补齐图表 / 回复审稿意见 / 交说明书'},
      {k:'planDate',l:'计划完成日',t:'date'},
      {k:'note',l:'备注',t:'textarea',full:1},
      {k:'materials',l:'相关资料（交底书 / 受理书 / 证书扫描件）',t:'rows',full:1}
    ]
  },

  copyright: {
    label:'软著', en:'SOFTWARE COPYRIGHT', unit:'项', idx:'05',
    statuses:[
      {k:'dev',n:'开发中'},{k:'preparing',n:'材料准备'},{k:'filed',n:'已提交'},
      {k:'accepted',n:'已受理'},{k:'registered',n:'已登记'},{k:'certified',n:'已下证',done:true}
    ],
    fields:[
      {k:'title',l:'软件全称',t:'text',req:1,full:1,hint:'例：桥墩冲刷智能计算软件'},
      {k:'shortName',l:'软件简称',t:'text'},
      {k:'version',l:'版本号',t:'text',hint:'例：V1.0'},
      {k:'regNo',l:'登记号',t:'text',hint:'例：2026SR0123456'},
      {k:'regCode',l:'登记证书号',t:'text'},
      {k:'completionDate',l:'开发完成日期',t:'date'},
      {k:'filingDate',l:'登记申请日期',t:'date'},
      {k:'regDate',l:'登记 / 下证日期',t:'date'},
      {k:'techStack',l:'开发技术栈',t:'text',full:1},
      {k:'devCount',l:'开发人数',t:'number'},
      {k:'myRank',l:'我的排名',t:'select',opts:RANK.copyright},
      {k:'nextAction',l:'下一步',t:'text',full:1,hint:'例：补齐图表 / 回复审稿意见 / 交说明书'},
      {k:'planDate',l:'计划完成日',t:'date'},
      {k:'note',l:'备注',t:'textarea',full:1},
      {k:'materials',l:'相关资料（源程序 / 说明书 / 证书扫描件）',t:'rows',full:1}
    ]
  },

  software: {
    label:'软件', en:'SOFTWARE', unit:'项', idx:'05',
    statuses:[
      {k:'dev',n:'开发中'},{k:'alpha',n:'内测'},{k:'released',n:'已发布',done:true},
      {k:'iterating',n:'迭代维护'},{k:'archived',n:'已归档',done:true}
    ],
    fields:[
      {k:'title',l:'软件 / 项目名称',t:'text',req:1,full:1},
      {k:'titleEn',l:'英文名称',t:'text',full:1},
      {k:'version',l:'当前版本',t:'text'},
      {k:'techStack',l:'技术栈',t:'text',full:1},
      {k:'repoUrl',l:'代码仓库',t:'text',full:1},
      {k:'liveUrl',l:'线上地址',t:'text',full:1},
      {k:'role',l:'担任角色',t:'select',opts:RANK.software},
      {k:'myRank',l:'贡献说明',t:'text',full:1,hint:'例：独立完成前后端与部署'},
      {k:'releaseDate',l:'首次发布日期',t:'date'},
      {k:'scale',l:'规模 / 数据',t:'text',full:1,hint:'例：12 个计算模块 / 服务 3 所设计院'},
      {k:'nextAction',l:'下一步',t:'text',full:1,hint:'例：补齐图表 / 回复审稿意见 / 交说明书'},
      {k:'planDate',l:'计划完成日',t:'date'},
      {k:'note',l:'备注',t:'textarea',full:1},
      {k:'materials',l:'相关资料（截图 / 说明书 / 使用文档）',t:'rows',full:1}
    ]
  }
};

const DONE_KEYS = {paper:['accepted','published'], thesis:['defended','final'], patent:['granted','maintained'],
                   copyright:['registered','certified'], software:['released','archived']};

const EN_STATUS = {
  paper:{idea:'Idea',writing:'Writing',ready:'Ready to submit',submitted:'Submitted',review:'Under review',
         major:'Major revision',minor:'Minor revision',accepted:'Accepted',published:'Published'},
  thesis:{topic:'Topic',proposal:'Proposal',writing:'Writing',midterm:'Mid-term',predef:'Pre-defense',
          blind:'Blind review',defended:'Defended',final:'Final'},
  patent:{idea:'Idea',brief:'Invention disclosure',drafting:'Drafting',filed:'Filed',accepted:'Accepted',
          prelim:'Preliminary exam',subst:'Substantive exam',granted:'Granted',maintained:'In force'},
  copyright:{dev:'In development',preparing:'Preparing',filed:'Filed',accepted:'Accepted',registered:'Registered',certified:'Certified'},
  software:{dev:'In development',alpha:'Beta',released:'Released',iterating:'Maintaining',archived:'Archived'}
};

/* ---------------- 数据层 ---------------- */

let DB = null;

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function today(){ return new Date().toISOString().slice(0,10); }

function blank(){ return { version:1, items:[], deadlines:[], profile:{}, activity:[], seedDone:false, seedExtrasDone:false, seedExtrasRev:0 }; }

function loadDB(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){ DB = JSON.parse(raw); }
  }catch(e){ console.warn('读取本地数据失败', e); }
  if(!DB || typeof DB !== 'object') DB = blank();
  DB.items     = Array.isArray(DB.items)     ? DB.items     : [];
  DB.deadlines = Array.isArray(DB.deadlines) ? DB.deadlines : [];
  DB.profile   = DB.profile || {};
  DB.activity  = Array.isArray(DB.activity) ? DB.activity : [];
  if(!DB.seedDone){ seed(); DB.seedDone = true; }
  // rev=3：重建正式成果（补全时间轴日期），保留演示种子
  if(DB.seedExtrasRev !== 3){
    DB.items = DB.items.filter(function(it){
      return it.type === 'software' || (it.type === 'copyright' && it.status === 'preparing');
    });
    DB.seedExtrasDone = false;
  }
  if(!DB.seedExtrasDone){ seedExtras(); }
  if(!DB.profile.name && !DB.profile.nameEn){ DB.profile.name = '邓明昊'; DB.profile.nameEn = 'Minghao Deng'; }
  save();
}

function save(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
  catch(e){ toast('保存失败：' + e.message, 'help'); }
}

function logAct(text){
  DB.activity = DB.activity || [];
  DB.activity.unshift({ date: today(), text: text });
  if(DB.activity.length > 200) DB.activity.length = 200;
}

function seed(){
  const base = { status:'', timeline:[], materials:[], createdAt:today(), updatedAt:today() };
  const docs = [
    ['堤顶高程计算软件',      '01-堤顶高程计算-说明文档.md',      'GB 50286-2013 附录 C 莆田试验站公式'],
    ['桥墩冲刷计算软件',      '02-桥墩冲刷计算-说明文档.md',      'SL/T 808-2025 附录 A.3.5 · JTG C30 · TB 10017'],
    ['桥梁壅水计算软件',      '03-桥梁壅水计算-说明文档.md',      'JTG C30-2015 · TB 10017 · SL/T 808-2025 附录 A.2'],
    ['水位流量关系计算软件',  '04-水位流量关系计算-说明文档.md',  'Manning 公式 · 宽顶堰 / 实用堰 / 薄壁堰'],
    ['堤防稳定分析软件',      '05-堤防稳定分析-说明文档.md',      '瑞典圆弧法 · 毕肖普法 · GB 50286-2013'],
    ['堤防渗流计算软件',      '06-堤防渗流计算-说明文档.md',      '杜普伊特公式 · 勃莱 / 莱恩爬行法 · GB 50286-2013']
  ];
  docs.forEach(function(d){
    DB.items.push(Object.assign({}, base, {
      id: uid(), type:'copyright',
      title: d[0], status:'preparing',
      fields: {
        title:d[0], version:'V1.0', techStack:'HTML / CSS / JavaScript（单文件，浏览器直接运行）',
        note:'规范依据：' + d[2],
        materials:[{name:'说明文档', url:'Software-copyright/' + d[1]}]
      },
      timeline:[{date:today(), text:'建立条目 · 状态「材料准备」'}]
    }));
  });
  DB.items.push(Object.assign({}, base, {
    id: uid(), type:'software',
    title:'CiteGlow 水利计算工具集', status:'released',
    fields:{
      title:'CiteGlow 水利计算工具集', titleEn:'CiteGlow Hydraulic Toolkit',
      techStack:'原生 HTML / CSS / JavaScript · Chart.js · Vercel Serverless',
      repoUrl:'https://github.com/DMing1001/water-tools',
      liveUrl:'https://citeglow.com/water-tools/',
      role:'独立开发', releaseDate:'2026-08-01',
      scale:'6 个计算模块 · 覆盖堤防 / 桥梁 / 水力计算',
      materials:[{name:'线上地址', url:'https://citeglow.com/water-tools/'}]
    },
    timeline:[{date:today(), text:'建立条目 · 状态「已发布」'}]
  }));
}

/* 真实成果预填 — 对照 E:\学术成果-材料汇总\主要成果汇总.xlsx
   不改动上方 7 条演示种子。rev=2：仅收录材料汇总中的正式成果 */
function seedExtras(){
  const base = { timeline:[], materials:[], createdAt:today(), updatedAt:today() };
  function push(o){ DB.items.push(Object.assign({}, base, o)); }

  /* ---- 期刊论文（主要成果汇总 · 论文表）---- */
  push({
    id: uid(), type:'paper', status:'published',
    title:'A Multi-Objective Optimization Framework for Check Dam Siting Integrating GIS, a Hydrological–Hydrodynamic Coupling Model, and NSGA-II',
    fields:{
      title:'A Multi-Objective Optimization Framework for Check Dam Siting Integrating GIS, a Hydrological–Hydrodynamic Coupling Model, and NSGA-II',
      authors:'Minghao Deng, Zhanbin Li, Wen Wang, Jiao Zhang, Ke Xiang, Yunxian Wang',
      authorsEn:'Minghao Deng, Zhanbin Li, Wen Wang, Jiao Zhang, Ke Xiang, Yunxian Wang',
      myRank:'第一作者',
      venue:'Journal of Hydrology', venueEn:'Journal of Hydrology',
      venueAbbr:'JOH', partition:'JCR Q1',
      doi:'WOS:001761165600001',
      submitDate:'2025-11-01', acceptDate:'2026-03-15', publishDate:'2026-06-20',
      kw:'check dam; siting; GIS; hydrological–hydrodynamic coupling; NSGA-II; multi-objective optimization',
      note:'材料汇总编号 1。文件：00论文\\Journal of Hydrology\\',
      materials:[
        {name:'JOH论文.pdf', url:'E:\\学术成果-材料汇总\\00论文\\Journal of Hydrology\\JOH论文.pdf'},
        {name:'论文录用证明.pdf', url:'E:\\学术成果-材料汇总\\00论文\\Journal of Hydrology\\论文录用证明.pdf'}
      ]
    },
    timeline:[{date:today(), text:'对照材料汇总建档 · JOH · WOS:001761165600001'}]
  });
  push({
    id: uid(), type:'paper', status:'published',
    title:'Mechanical enhancement and microstructural evolution of fiber–binder stabilized loess: experimental evaluation and multi-objective mix design optimization',
    fields:{
      title:'Mechanical enhancement and microstructural evolution of fiber–binder stabilized loess: experimental evaluation and multi-objective mix design optimization',
      authors:'Minghao Deng, Shaobo Xue, Wen Wang, Zhanbin Li, Xiang Chen',
      authorsEn:'Minghao Deng, Shaobo Xue, Wen Wang, Zhanbin Li, Xiang Chen',
      myRank:'第一作者',
      venue:'Materials & Design', venueEn:'Materials & Design',
      venueAbbr:'MD', partition:'JCR Q2',
      doi:'WOS:001633849200004',
      submitDate:'2025-12-10', acceptDate:'2026-05-08', publishDate:'2026-07-01',
      kw:'loess; fiber–binder; microstructure; multi-objective mix design',
      note:'材料汇总编号 3。文件：00论文\\Materials & Design\\',
      materials:[
        {name:'MD.pdf', url:'E:\\学术成果-材料汇总\\00论文\\Materials & Design\\MD.pdf'},
        {name:'论文录用通知-03.pdf', url:'E:\\学术成果-材料汇总\\00论文\\Materials & Design\\论文录用通知-03.pdf'}
      ]
    },
    timeline:[{date:today(), text:'对照材料汇总建档 · Materials & Design · WOS:001633849200004'}]
  });
  push({
    id: uid(), type:'paper', status:'accepted',
    title:'Geometric Optimization of a Vertical-Shaft Spiral Spillway Tunnel Based on a Kriging Surrogate Model',
    fields:{
      title:'Geometric Optimization of a Vertical-Shaft Spiral Spillway Tunnel Based on a Kriging Surrogate Model',
      myRank:'第一作者',
      venue:'Journal of Hydrodynamics', venueEn:'Journal of Hydrodynamics',
      partition:'JCR Q3',
      acceptDate:'2026-04-20',
      note:'材料汇总编号 2。台账中作者/WOS 暂空，请在条目里补全。',
      materials:[{name:'录用证明材料.pdf', url:'E:\\学术成果-材料汇总\\00论文\\录用证明材料.pdf'}]
    },
    timeline:[{date:today(), text:'对照材料汇总建档 · Journal of Hydrodynamics'}]
  });

  /* ---- 发明专利（主要成果汇总 · 专利表）---- */
  const patents = [
    {
      status:'granted', title:'一种以防洪和经济性为目标的淤地坝布设位置选取方法',
      applicationNo:'2023113137800', filingDate:'2023-10-11', grantDate:'2024-06-18',
      inventors:'王雯，邓明昊，李占斌', myRank:'第二发明人',
      grantNo:'2023113137800',
      note:'材料汇总编号 1 · 已授权。证书/年费：01专利\\一种以防洪和经济性…\\',
      timeline:[{date:'2024-06-18', text:'授权'}],
      mats:[
        {name:'发明专利证书', url:'E:\\学术成果-材料汇总\\01专利\\一种以防洪和经济性为目标的淤地坝布设位置选取方法\\PCN230010406-发明专利证书.pdf'},
        {name:'授权通知书', url:'E:\\学术成果-材料汇总\\01专利\\一种以防洪和经济性为目标的淤地坝布设位置选取方法\\2023113137800授权通知书.pdf'}
      ]
    },
    {
      status:'subst', title:'一种以水土流失治理效益和建设成本为目标的淤地坝布设方法',
      applicationNo:'2023116593612', filingDate:'2023-12-05',
      inventors:'王雯，邓明昊，薛涛', myRank:'第二发明人',
      note:'材料汇总编号 2 · 审查中。以布设位置与设计淤积年限为决策因子，拦沙量/淤地效益/建设成本多目标。',
      timeline:[{date:'2024-08-01', text:'进入实质审查'}],
      mats:[{name:'实质审查通知书', url:'E:\\学术成果-材料汇总\\01专利\\其它受理中-实质性审查中的专利证明文件\\2024-一种以水土流失治理效益和建设成本为目标的淤地坝布设方法\\PCN230010266-发明专利申请进入实质审查阶段通知书.pdf'}]
    },
    {
      status:'subst', title:'一种基于水文水动力耦合模型的淤地坝选址方法',
      applicationNo:'2024112719156', filingDate:'2024-09-11',
      inventors:'王雯，邓明昊，沈荣建', myRank:'第二发明人',
      note:'材料汇总编号 3 · 审查中。GIS+水文+水动力+代理模型+多目标；PCN24009062。',
      timeline:[{date:'2025-02-10', text:'进入实质审查'}],
      mats:[{name:'实质审查通知书', url:'E:\\学术成果-材料汇总\\01专利\\其它受理中-实质性审查中的专利证明文件\\2024-一种基于水文水动力耦合模型的淤地坝选址方法\\03-PCN24009062-发明专利申请进入实质审查阶段通知书.pdf'}]
    },
    {
      status:'subst', title:'一种综合自然因素与社会经济因素的水土流失治理优先级的评定方法',
      applicationNo:'202511291194X', filingDate:'2025-09-10',
      inventors:'王雯，邓明昊，李占斌', myRank:'第二发明人',
      note:'材料汇总编号 4 · 审查中。PCN250011966。',
      timeline:[{date:'2026-01-15', text:'进入实质审查'}],
      mats:[{name:'实质审查通知书', url:'E:\\学术成果-材料汇总\\01专利\\其它受理中-实质性审查中的专利证明文件\\2025-一种综合自然因素与社会经济因素的水土流失治理优先级的评定方法\\01-PCN250011966-发明专利申请进入实质审查阶段通知书.pdf'}]
    },
    {
      status:'subst', title:'一种综合梯田灌溉的可蓄水淤地坝选址方法与建设优化方法',
      applicationNo:'2025115613393', filingDate:'2025-10-29',
      inventors:'王雯，邓明昊，李占斌', myRank:'第二发明人',
      note:'材料汇总编号 5 · 审查中。PCN250015200。',
      timeline:[{date:'2026-03-01', text:'进入实质审查'}],
      mats:[{name:'实质审查通知书', url:'E:\\学术成果-材料汇总\\01专利\\其它受理中-实质性审查中的专利证明文件\\2025-一种综合考虑梯田分布的可蓄水淤地坝选址方法\\PCN250015200-发明专利申请进入实质审查阶段通知书.pdf'}]
    },
    {
      status:'accepted', title:'一种考虑宏微观性能协同响应的固化黄土配比优化方法',
      applicationNo:'202611174508.2', filingDate:'2026-08-04',
      inventors:'王雯，邓明昊，薛少博，李占斌', myRank:'第二发明人',
      note:'材料汇总编号 6 · 审查中/已受理。PCN26007584。',
      mats:[{name:'专利申请受理通知书', url:'E:\\学术成果-材料汇总\\01专利\\其它受理中-实质性审查中的专利证明文件\\2026-一种考虑宏微观性能协同响应的固化黄土配比优化方法\\PCN26007584-专利申请受理通知书.pdf'}]
    }
  ];
  patents.forEach(function(p){
    push({
      id: uid(), type:'patent', status:p.status, title:p.title,
      fields:{
        title:p.title, patentType:'发明专利',
        applicationNo:p.applicationNo, grantNo:p.grantNo || '',
        applicants:'西安理工大学',
        inventors:p.inventors, myRank:p.myRank,
        filingDate:p.filingDate,
        note:p.note,
        materials:p.mats
      },
      timeline:[{date:today(), text:'对照材料汇总建档 · ' + p.applicationNo}]
    });
  });

  /* ---- 软著（主要成果汇总 · 软著表，已下证 3 项）---- */
  const copies = [
    {
      title:'基于 ArcGIS Pro 的流域水文地形分析系统', version:'V1.0', regNo:'2026SR0457449',
      regDate:'2026-02-20', filingDate:'2026-01-10',
      file:'软著证书01-基于 ArcGIS Pro 的流域水文地形分析系统.pdf',
      note:'材料汇总软著 1 · 已登记。干流识别—断面—汇水—库容一体化。'
    },
    {
      title:'二维水动力后处理分析系统', version:'V1.0', regNo:'2026SR0342009',
      regDate:'2026-03-12', filingDate:'2026-02-01',
      file:'软著证书02-二维水动力后处理分析系统 .pdf',
      note:'材料汇总软著 2 · 已登记。WSE/V/H 栅格断面化统计。'
    },
    {
      title:'基于河网拓扑的淤地坝多策略候选址系统', version:'V1.0', regNo:'2026SR0158082',
      regDate:'2026-04-08', filingDate:'2026-02-20',
      file:'软著证书03-基于河网拓扑的淤地坝多策略候选址系统.pdf',
      note:'材料汇总软著 3 · 已登记。Headwater/Junction/Spacing 多策略候选。'
    }
  ];
  copies.forEach(function(c){
    push({
      id: uid(), type:'copyright', status:'certified', title:c.title,
      fields:{
        title:c.title, version:c.version, regNo:c.regNo,
        filingDate:c.filingDate, regDate:c.regDate,
        techStack:'ArcGIS Pro / Python 工具箱',
        myRank:'第一著作权人',
        note:c.note,
        materials:[{name:c.file, url:'E:\\学术成果-材料汇总\\02软著\\' + c.file}]
      },
      timeline:[{date:today(), text:'对照材料汇总建档 · 已下证 · ' + c.regNo}]
    });
  });

  DB.seedExtrasDone = true;
  DB.seedExtrasRev = 3;
  logAct('对照《主要成果汇总》预填：论文 3 · 专利 6 · 软著 3（含时间轴节点）');
}

/* ---------------- 工具函数 ---------------- */

const $  = function(s,r){ return (r||document).querySelector(s); };
const $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

function esc(v){
  return String(v==null?'':v).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function nl(v){ return esc(v).replace(/\n/g,'<br>'); }
function num(v){ return (v===0||v) && v!=='' ? Number(v) : null; }

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}

function copyText(txt){
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(txt).then(function(){ toast('已复制到剪贴板', 'check'); },
                                            function(){ legacyCopy(txt); });
  } else legacyCopy(txt);
}
function legacyCopy(txt){
  const ta = document.createElement('textarea');
  ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); toast('已复制到剪贴板', 'check'); }
  catch(e){ toast('复制失败，请手动选择', 'warn'); }
  document.body.removeChild(ta);
}
function downloadFile(name, content, mime){
  const blob = new Blob([content], {type: mime || 'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
}

function stDef(type, key){
  const arr = TYPES[type].statuses;
  for(let i=0;i<arr.length;i++) if(arr[i].k===key) return {def:arr[i], i:i, n:arr.length};
  return {def:{k:key,n:key||'未设置'}, i:0, n:arr.length};
}
function isDone(type, key){ return DONE_KEYS[type].indexOf(key) >= 0; }
function progress(type, key){
  const s = stDef(type, key);
  return Math.round((s.i + 1) / s.n * 100);
}
function daysBetween(a, b){
  return Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00')) / 86400000);
}

function fmtSize(n){
  if(!n && n !== 0) return '';
  if(n >= 1048576) return (n/1048576).toFixed(1) + ' MB';
  return Math.max(1, Math.round(n/1024)) + ' KB';
}

const TOAST_ICON = {
  check: '<svg class="ti" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8l4 4 8-9"/></svg>',
  help:  '<svg class="ti" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M6.3 6.2A1.8 1.8 0 0 1 9.7 7c0 1.2-1.7 1.4-1.7 2.5M8 12h.01"/></svg>',
  back:  '<svg class="ti" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 8a5 5 0 1 0 2-4M3 2v3h3"/></svg>',
  folder:'<svg class="ti" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1.5 3.5h5l1.5 2h6.5v7h-13z"/></svg>',
  warn:  '<svg class="ti" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2l6 11H2L8 2zM8 6v4M8 12h.01"/></svg>'
};

function toast(msg, icon){
  const t = $('#toast');
  t.innerHTML = (TOAST_ICON[icon] || TOAST_ICON.check) + '<span>' + esc(msg) + '</span>';
  t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}

/* 分段进度条：只标当前阶段，完整链路放 title */
function trackHTML(type, statusKey){
  const arr = TYPES[type].statuses;
  const cur = stDef(type, statusKey);
  const chain = arr.map(function(s){ return s.n; }).join(' → ');
  let segs = '';
  arr.forEach(function(s, i){
    let cls = '';
    if(i < cur.i) cls = s.done ? ' past done-final' : ' past';
    else if(i === cur.i) cls = ' cur' + (s.done ? ' done-final' : '');
    segs += '<i class="' + cls.trim() + '"></i>';
  });
  const label = cur.def.n || '未设置';
  return '<div class="pstep" title="' + esc(chain) + '">' +
         '<div class="pseg" aria-label="阶段进度">' + segs + '</div>' +
         '<div class="pcap"><b>' + esc(label) + '</b><span>' + (cur.i+1) + '/' + cur.n + '</span></div>' +
         '</div>';
}

function itemDueInfo(it){
  const list = (DB.deadlines || []).filter(function(d){ return d.itemId === it.id && !d.done; });
  if(!list.length) return null;
  list.sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  const d = list[0];
  const left = daysBetween(today(), d.date);
  return { d: d, left: left, near: left >= 0 && left <= 14 };
}

/* ---------------- 渲染：Hero 背景 ---------------- */

function renderHeroBg(){
  const unit = 'RESEARCH · ';
  let txt = ''; for(let i=0;i<18;i++) txt += unit;
  let h = '';
  // 仅 2 行底字，极慢横移（约 2.5–3 分钟一轮）
  for(let i=0;i<2;i++){
    const dur = (i === 0) ? 150 : 180;
    h += '<div class="mq' + (i%2 ? ' rev' : '') + '" style="animation:none">' +
         '<span style="animation-duration:' + dur + 's">' + txt + txt + '</span></div>';
  }
  $('#heroBg').innerHTML = h;
}

/* ---------------- 渲染：总览 ---------------- */

function renderStats(){
  let h = '';
  Object.keys(TYPES).forEach(function(t){
    const arr = DB.items.filter(function(x){ return x.type===t; });
    const done = arr.filter(function(x){ return isDone(t, x.status); }).length;
    h += '<div class="stat" data-act="jump" data-type="' + t + '" role="button" tabindex="0">' +
         '<div class="n">' + arr.length + '<small>' + TYPES[t].unit + '</small></div>' +
         '<div class="l">' + TYPES[t].label + '</div>' +
         '<div class="p">已定稿 ' + done + ' · 进行中 ' + (arr.length-done) + '</div></div>';
  });
  $('#stats').innerHTML = h;
}

function jumpTo(type){
  showView(type === 'copyright' || type === 'software' ? 'ip' : type);
}

function showView(name){
  const key = name || 'dash';
  if(window._listFilter && window._listFilter.type !== mapTypeToView(window._listFilter.type) && window._listFilter.view !== key){
    // 保持筛选若仍在同一分类视图
  }
  if(window._listFilter && window._listFilter.view !== key){
    window._listFilter = null;
  }
  $$('.view, .view-hero').forEach(function(el){
    el.classList.toggle('on', el.getAttribute('data-view') === key);
  });
  $$('.nav-links a').forEach(function(a){
    a.classList.toggle('on', a.getAttribute('data-view') === key);
  });
  closeDrawer();
  window.scrollTo(0, 0);
  if(window._open){ window._open = null; }
  renderAll();
}

function mapTypeToView(t){ return t; }

function renderIdentityClock(){
  const name = DB.profile.name || 'RESEARCHER';
  const nameEn = DB.profile.nameEn || '';
  $('#idName').textContent = name;
  $('#idMeta').textContent = nameEn ? (nameEn + ' · 本地优先') : '学术成果管理台 · 本地优先';
  const total = DB.items.length;
  const done = DB.items.filter(function(x){ return isDone(x.type, x.status); }).length;
  $('#idStat').textContent = '在制 ' + (total - done) + ' · 已定稿 ' + done + ' · 累计 ' + total;
}

function tickClock(){
  const d = new Date();
  const p = function(n){ return String(n).padStart(2,'0'); };
  const el = $('#clockTime'); if(el) el.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  const days = ['日','一','二','三','四','五','六'];
  const ed = $('#clockDate');
  if(ed) ed.textContent = d.getFullYear() + '.' + p(d.getMonth()+1) + '.' + p(d.getDate()) + '  星期' + days[d.getDay()];
}

/* ---------------- 在写清单 ---------------- */

const WIP_KEYS = {
  paper:    ['idea','writing','ready','submitted','review','major','minor'],
  thesis:   ['topic','proposal','writing','midterm','predef','blind'],
  patent:   ['idea','brief','drafting'],
  copyright:['dev','preparing','filed','accepted'],
  software: ['dev','alpha','iterating']
};

function wipItems(){
  return DB.items.filter(function(it){
    if(it.type === 'copyright' && isDemoSeedCopyright(it)) return false;
    return (WIP_KEYS[it.type] || []).indexOf(it.status) >= 0;
  });
}

function wipSortKey(it){
  const f = it.fields || {};
  const plan = f.planDate || '';
  if(!plan) return { rank: 3, left: null };
  const left = daysBetween(today(), plan);
  if(left < 0) return { rank: 0, left: left };
  if(left <= 7) return { rank: 1, left: left };
  return { rank: 2, left: left };
}

function renderWipList(){
  const box = $('#wipList'); if(!box) return;
  const arr = wipItems().map(function(it){ return { it: it, s: wipSortKey(it) }; })
    .sort(function(a, b){
      if(a.s.rank !== b.s.rank) return a.s.rank - b.s.rank;
      const al = a.s.left == null ? 99999 : a.s.left;
      const bl = b.s.left == null ? 99999 : b.s.left;
      return al - bl;
    });
  if(!arr.length){
    box.innerHTML = '<div class="empty"><b>没有在写条目</b>定稿/授权/下证之外、且已进入撰写的成果会出现在这里' +
      '<div><button class="btn btn-ghost btn-sm" data-act="edit-new" data-type="paper">＋ 新建小论文</button></div></div>';
    return;
  }
  box.innerHTML = arr.map(function(row){
    const it = row.it, s = row.s;
    const f = it.fields || {};
    const overdue = s.left != null && s.left < 0;
    const near = s.left != null && s.left >= 0 && s.left <= 7;
    const kind = TYPES[it.type].label;
    let dueTxt = '未设计划日';
    if(s.left != null){
      if(s.left < 0) dueTxt = '计划 ' + f.planDate + ' · 已逾期 ' + Math.abs(s.left) + ' 天';
      else if(s.left === 0) dueTxt = '计划 ' + f.planDate + ' · 今天';
      else dueTxt = '计划 ' + f.planDate + ' · 还有 ' + s.left + ' 天';
    }
    const next = (f.nextAction || '').trim();
    const st = stDef(it.type, it.status);
    return '<div class="wip-card' + (overdue ? ' overdue' : '') + '">' +
      '<div class="top">' +
        '<span class="kind">' + esc(kind) + '</span>' +
        '<div class="nm">' + esc(it.title) + '</div>' +
        statusTag(it) +
      '</div>' +
      trackHTML(it.type, it.status) +
      '<div class="next"><b>下一步</b>' + esc(next || '（未填）') + '</div>' +
      '<div class="meta">' +
        '<span class="' + (overdue || near ? 'due-near' : '') + '">' + esc(dueTxt) + '</span>' +
        '<span>' + (st.i+1) + '/' + st.n + '</span>' +
      '</div>' +
      '<div class="acts">' +
        (st.i < st.n-1 ? '<button class="btn btn-primary btn-sm" data-act="advance" data-id="' + it.id + '">推进 → ' + esc(TYPES[it.type].statuses[st.i+1].n) + '</button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-act="edit" data-type="' + it.type + '" data-id="' + it.id + '">编辑下一步 / 计划日</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

/* 成果图谱：分类 × 状态计数（软著不含演示种子） */
function isDemoSeedCopyright(it){
  if(it.type !== 'copyright') return false;
  const mats = (it.fields && it.fields.materials) || [];
  return mats.some(function(m){ return String(m.url || '').indexOf('Software-copyright/') === 0; });
}

const STATUS_BUCKETS = {
  paper: [
    { k:'在写', keys:['idea','writing','ready'] },
    { k:'在审', keys:['submitted','review','major','minor'] },
    { k:'录用', keys:['accepted'], mint:true },
    { k:'见刊', keys:['published'], mint:true }
  ],
  patent: [
    { k:'在写', keys:['idea','brief','drafting'] },
    { k:'在审', keys:['filed','accepted','prelim','subst'] },
    { k:'授权', keys:['granted','maintained'], mint:true }
  ],
  copyright: [
    { k:'在写', keys:['dev','preparing'] },
    { k:'在审', keys:['filed','accepted'] },
    { k:'下证', keys:['registered','certified'], mint:true }
  ]
};

function renderMap(){
  const box = $('#mapBox'); if(!box) return;
  const rows = [
    { type:'paper', label:'论文' },
    { type:'patent', label:'专利' },
    { type:'copyright', label:'软著' }
  ];
  let h = '<div class="mstat">';
  rows.forEach(function(row){
    const list = DB.items.filter(function(it){
      if(it.type !== row.type) return false;
      if(row.type === 'copyright' && isDemoSeedCopyright(it)) return false;
      return true;
    });
    h += '<div class="mstat-row"><span class="lb">' + row.label + '</span>';
    STATUS_BUCKETS[row.type].forEach(function(b){
      const n = list.filter(function(it){ return b.keys.indexOf(it.status) >= 0; }).length;
      const keys = b.keys.join(',');
      h += '<div class="mstat-chip' + (b.mint ? ' mint' : '') + '"' +
           ' data-act="map-filter" data-type="' + row.type + '"' +
           ' data-keys="' + esc(keys) + '" data-label="' + esc(b.k) + '"' +
           ' tabindex="0" role="button"' +
           ' title="查看「' + esc(row.label + ' · ' + b.k) + '」列表">' +
           '<span class="k">' + esc(b.k) + '</span>' +
           '<span class="n">' + n + '</span>' +
           '</div>';
    });
    h += '</div>';
  });
  h += '</div>';
  box.innerHTML = h;
}

/* 成果关键节点：论文投稿/录用/见刊 · 专利申请/实审/授权 · 软著申请/下证 */
/* 竖排日期：2023 / 10 / 11（补零） */
function dateStackHTML(date){
  if(!date) return '<span class="dt-stack"><span class="y">—</span></span>';
  const p = String(date).slice(0,10).split('-');
  if(p.length < 3) return '<span class="dt-stack"><span class="md">' + esc(date) + '</span></span>';
  const y = p[0], m = String(p[1]).padStart(2,'0'), d = String(p[2]).padStart(2,'0');
  return '<span class="dt-stack">' +
    '<span class="y">' + esc(y) + '</span>' +
    '<span class="md">' + esc(m) + '</span>' +
    '<span class="md">' + esc(d) + '</span>' +
    '</span>';
}

function itemMilestones(it){
  const f = it.fields || {};
  const out = [];
  function add(date, label, mint){
    if(date) out.push({ date:String(date).slice(0,10), label:label, mint:!!mint });
  }
  if(it.type === 'paper'){
    add(f.submitDate, '投稿', false);
    add(f.acceptDate, '录用', true);
    add(f.publishDate, '见刊', true);
  } else if(it.type === 'patent'){
    add(f.filingDate, '申请', false);
    const tl = (it.timeline||[]).filter(function(x){ return /实质|实审|公布/.test(x.text); })[0];
    if(tl) add(tl.date, '实审', false);
    add(f.grantDate, '授权', true);
  } else if(it.type === 'copyright'){
    add(f.filingDate || f.completionDate, '申请', false);
    add(f.regDate, '下证', true);
  } else if(it.type === 'software'){
    add(f.releaseDate, '发布', true);
  }
  out.sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  return out;
}

function itemPrimaryMilestone(it){
  const ms = itemMilestones(it);
  if(!ms.length) return null;
  // 总轴只露最关键一格：优先定稿类，否则最后有日期的
  for(let i = ms.length-1; i >= 0; i--) if(ms[i].mint) return ms[i];
  return ms[ms.length-1];
}

function itemStageNodes(it){
  // 单项轴：阶段链（撰写进度）+ 已填日期叠在对应阶段上
  const arr = TYPES[it.type].statuses;
  const cur = stDef(it.type, it.status);
  const ms = itemMilestones(it);
  // 把日期节点映射到相近阶段名
  const map = { 投稿:'submitted', 录用:'accepted', 见刊:'published',
                申请:'filed', 实审:'subst', 授权:'granted',
                下证:'certified', 发布:'released', 受理:'accepted' };
  return arr.map(function(s, i){
    let date = '';
    ms.forEach(function(m){
      if(map[m.label] === s.k && !date) date = m.date;
      if(m.label === '申请' && (s.k==='filed'||s.k==='dev') && !date && i<=1) date = m.date;
      if(m.label === '下证' && s.k==='certified') date = m.date;
      if(m.label === '授权' && (s.k==='granted'||s.k==='maintained') && !date) date = m.date;
    });
    const past = i < cur.i;
    const isCur = s.k === it.status;
    return {
      label: s.n, date: date,
      past: past, cur: isCur,
      done: isCur && s.done, plan: !past && !isCur
    };
  });
}

function renderAchTimeline(){
  const box = $('#tlStage'); if(!box) return;
  const mode = window._tlMode || 'all';
  const filter = window._tlFilter || 'all';

  if(mode === 'item'){
    const it = DB.items.filter(function(x){ return x.id === window._tlItemId; })[0];
    if(!it){ window._tlMode = 'all'; return renderAchTimeline(); }
    const nodes = itemStageNodes(it);
    const nodeHtml = nodes.map(function(n){
      let cls = 'tl-node';
      if(n.cur) cls += n.done ? ' mint' : ' done';
      else if(n.past) cls += ' done';
      else cls += ' plan';
      return '<div class="' + cls + '">' +
        '<div class="top">' +
          dateStackHTML(n.date) +
          '<span class="ev">' + esc(n.label) + '</span>' +
        '</div>' +
        '<span class="stem"></span><span class="dot"></span>' +
        '<div class="bot"></div>' +
      '</div>';
    }).join('');
    const st = stDef(it.type, it.status);
    box.innerHTML =
      '<div class="tl-item-head">' +
        '<a class="back" href="#" data-act="tl-back">← 总轴</a>' +
        '<div class="nm">' + esc(it.title) + '</div>' +
        statusTag(it) +
      '</div>' +
      '<div class="tl-prog"><span class="lb">撰写进度</span>' + trackHTML(it.type, it.status) + '</div>' +
      '<div class="tl-line item-mode"><div class="tl-nodes">' + nodeHtml + '</div></div>';
    return;
  }

  // 总轴：一根线，每项成果只露最关键 1 个节点
  let ev = [];
  DB.items.forEach(function(it){
    const key = itemPrimaryMilestone(it);
    const group = (it.type === 'paper') ? 'paper' : (it.type === 'patent' ? 'patent' : 'copyright');
    if(filter !== 'all' && group !== filter) return;
    if(key){
      ev.push({ date:key.date, label:key.label, mint:key.mint, it:it, group:group });
    } else {
      // 无日期：用 createdAt 占位，标「在制」
      ev.push({ date:(it.createdAt||'').slice(0,10), label:stDef(it.type,it.status).def.n, mint:false, it:it, group:group, soft:true });
    }
  });
  ev.sort(function(a,b){ return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });

  if(!ev.length){
    box.innerHTML = '<div class="tl-empty">暂无时间节点 — 在条目里填上投稿/录用/申请/授权等日期后会出现在总轴</div>';
    return;
  }
  const kindOf = function(g){ return g==='paper' ? 'PAPER' : (g==='patent' ? 'PATENT' : 'IP'); };
  box.innerHTML = '<div class="tl-line"><div class="tl-nodes">' + ev.map(function(e){
    const cls = 'tl-node ' + (e.mint ? 'mint' : (e.soft ? 'plan' : 'done'));
    return '<div class="' + cls + '" data-act="tl-item" data-id="' + e.it.id + '" tabindex="0" role="button" title="' + esc(e.it.title) + '">' +
      '<div class="top">' +
        dateStackHTML(e.date) +
        '<span class="ev">' + esc(e.label) + '</span>' +
      '</div>' +
      '<span class="stem"></span><span class="dot"></span>' +
      '<div class="bot">' +
        '<span class="kind">' + kindOf(e.group) + '</span>' +
        '<div class="tt">' + esc(e.it.title) + '</div>' +
      '</div>' +
    '</div>';
  }).join('') + '</div></div>';
}

function renderDeadlines(){
  const list = DB.deadlines.slice().sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  const box = $('#deadlines');
  if(!list.length){
    box.innerHTML = '<div class="empty"><b>还没有时间节点</b>添加截稿日、答辩日、答复期限，这里会自动倒计时' +
      '<div><button class="btn btn-primary btn-sm" data-act="deadline-new">＋ 添加节点</button></div></div>';
    return;
  }
  let h = '';
  list.forEach(function(d){
    const left = daysBetween(today(), d.date);
    const cls  = d.done ? 'over' : (left < 0 ? 'over' : (left <= 14 ? 'urgent' : ''));
    const dd   = left < 0 ? '已过' : left;
    h += '<div class="dl ' + cls + '">' +
         '<div class="d">' + (d.done ? '✓' : dd) + (d.done ? '' : '<small>天</small>') + '</div>' +
         '<div class="info"><b>' + esc(d.title) + '</b>' +
         '<span>' + esc(d.date) + (d.note ? ' · ' + esc(d.note) : '') + '</span></div>' +
         '<button class="btn btn-ghost btn-sm" data-act="deadline-edit" data-id="' + d.id + '">编辑</button>' +
         '<button class="btn btn-danger btn-sm" data-act="deadline-del" data-id="' + d.id + '">删除</button></div>';
  });
  box.innerHTML = h;
}

function renderActivity(){
  const map = {};
  function put(date, text){
    if(!date || !text) return;
    const k = date + '|' + text;
    if(map[k]) return;
    map[k] = { date:date, text:text };
  }
  (DB.activity || []).forEach(function(a){ put(a.date, a.text); });
  DB.items.forEach(function(it){
    (it.timeline||[]).forEach(function(t){ put(t.date, it.title + ' — ' + t.text); });
  });
  const ev = Object.keys(map).map(function(k){ return map[k]; })
    .sort(function(a,b){ return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
  const box = $('#activity');
  if(!ev.length){ box.innerHTML = '<div class="empty"><b>暂无动态</b>修改条目状态后会自动记录时间线</div>'; return; }
  box.innerHTML = '<ul class="tl">' + ev.slice(0,5).map(function(e){
    return '<li><time>' + esc(e.date) + '</time>' + esc(e.text) + '</li>';
  }).join('') + '</ul>';
}

function renderAlert(){
  const soon = DB.deadlines.filter(function(d){
    if(d.done) return false;
    const left = daysBetween(today(), d.date);
    return left >= 0 && left <= 7;
  });
  const bar = $('#alertBar');
  if(!soon.length){ bar.style.display='none'; return; }
  $('#alertText').innerHTML = '⏰ 提醒：' + soon.map(function(d){
    const left = daysBetween(today(), d.date);
    return '<b>' + esc(d.title) + '</b> 还有 ' + (left===0?'今天':left+' 天') ;
  }).join('；');
  bar.style.display = '';
  if(window._notified) return;
  window._notified = true;
  if('Notification' in window && Notification.permission === 'granted'){
    soon.forEach(function(d){
      new Notification('Research Hub · 节点提醒', { body: d.title + ' · ' + d.date });
    });
  }
}

function askNotify(){
  if(!('Notification' in window)){ toast('当前浏览器不支持桌面提醒', 'help'); return; }
  Notification.requestPermission().then(function(p){
    toast(p==='granted' ? '桌面提醒已开启' : '未获得提醒权限', p==='granted' ? 'check' : 'warn');
    if(p==='granted'){ window._notified = false; renderAlert(); }
  });
}
function dismissAlert(){ $('#alertBar').style.display='none'; }
function closeDrawer(){ $('#drawer').classList.remove('open'); }

/* ---------------- 渲染：列表 ---------------- */

function summaryOf(it){
  const f = it.fields || {};
  const p = [];
  if(it.type==='paper'){
    if(f.venue) p.push(f.venue + (f.venueAbbr ? '（' + f.venueAbbr + '）' : ''));
    if(f.partition) p.push(f.partition);
    if(f.ifVal) p.push('IF ' + f.ifVal);
    if(f.myRank) p.push(f.myRank);
    if(f.year) p.push(f.year);
  } else if(it.type==='thesis'){
    if(f.degree) p.push(f.degree + '学位论文');
    if(f.school) p.push(f.school);
    if(f.advisor) p.push('导师：' + f.advisor);
    if(f.year) p.push(f.year + ' 年答辩');
    const ch = (f.chapters||[]);
    const done = ch.filter(function(c){ return c.status==='定稿'; }).length;
    if(ch.length) p.push('章节 ' + done + '/' + ch.length + ' 定稿');
  } else if(it.type==='patent'){
    if(f.patentType) p.push(f.patentType);
    if(f.applicationNo) p.push('申请号 ' + f.applicationNo);
    if(f.myRank) p.push(f.myRank);
    if(f.filingDate) p.push(f.filingDate);
  } else if(it.type==='copyright'){
    if(f.version) p.push(f.version);
    if(f.regNo) p.push('登记号 ' + f.regNo);
    if(f.myRank) p.push(f.myRank);
    if(f.regDate) p.push(f.regDate);
  } else {
    if(f.version) p.push(f.version);
    if(f.role) p.push(f.role);
    if(f.releaseDate) p.push(f.releaseDate);
    if(f.liveUrl) p.push('已上线');
  }
  return p.filter(Boolean).join(' · ');
}

function statusTag(it){
  const s = stDef(it.type, it.status);
  const cls = s.def.done ? 'done' : (s.def.warn ? 'warn' : (it.status ? 'solid' : 'mute'));
  return '<span class="tag ' + cls + '">' + esc(s.def.n) + '</span>';
}

function renderList(type){
  let arr = DB.items.filter(function(x){ return x.type===type; })
                    .sort(function(a,b){ return (b.updatedAt||'') < (a.updatedAt||'') ? -1 : 1; });
  const fl = window._listFilter;
  const active = fl && fl.type === type && fl.keys;
  if(active){
    arr = arr.filter(function(it){ return fl.keys.indexOf(it.status) >= 0; });
    // 软著筛选时排除演示种子
    if(type === 'copyright') arr = arr.filter(function(it){ return !isDemoSeedCopyright(it); });
  }
  const box = document.getElementById('list-' + type);
  let pill = '';
  if(active){
    pill = '<div class="filter-pill">筛选：<b>' + esc(TYPES[type].label + ' · ' + fl.label) + '</b>' +
           '（' + arr.length + ' 条）' +
           '<button data-act="filter-clear">显示全部</button></div>';
  }
  if(!arr.length){
    box.innerHTML = pill + '<div class="empty"><b>暂无' + TYPES[type].label + '条目</b>' +
      (active ? '当前筛选条件下没有结果，点「显示全部」' : '开始记录你的第一条' + TYPES[type].label) +
      '<div><button class="btn btn-primary btn-sm" data-act="edit-new" data-type="' + type + '">＋ 新建' + TYPES[type].label + '</button></div></div>';
    return;
  }
  let h = pill;
  arr.forEach(function(it, i){
    const s = stDef(it.type, it.status);
    const open = window._open === it.id;
    const due = itemDueInfo(it);
    h += '<div class="row" data-id="' + it.id + '">' +
      '<div class="no">' + String(i+1).padStart(2,'0') + '</div>' +
      '<div class="main">' +
        '<div class="title row-open" data-act="toggle" data-id="' + it.id + '">' + esc(it.title) + '</div>' +
        (summaryOf(it) ? '<div class="desc">' + esc(summaryOf(it)) + '</div>' : '') +
        (due ? '<div class="due-chip' + (due.near ? ' near' : '') + '">节点 ' + esc(due.d.date) +
               (due.left < 0 ? ' · 已过期' : (due.near ? ' · 还有 ' + due.left + ' 天' : '')) + '</div>' : '') +
        trackHTML(it.type, it.status) +
        '<div class="acts">' +
          '<button class="btn btn-ghost btn-sm" data-act="toggle" data-id="' + it.id + '">' + (open ? '收起' : '详情') + '</button>' +
          '<button class="btn btn-ghost btn-sm" data-act="edit" data-type="' + type + '" data-id="' + it.id + '">编辑</button>' +
          (s.i > 0 ? '<button class="btn btn-ghost btn-sm" data-act="back" data-id="' + it.id + '">← ' + esc(TYPES[type].statuses[s.i-1].n) + '</button>' : '') +
          (s.i < s.n-1 ? '<button class="btn btn-ghost btn-sm" data-act="advance" data-id="' + it.id + '">推进 → ' + esc(TYPES[type].statuses[s.i+1].n) + '</button>' : '') +
          '<button class="btn btn-danger btn-sm" data-act="del" data-id="' + it.id + '">删除</button>' +
        '</div>' +
      '</div>' +
      '<div class="side">' + statusTag(it) +
        '<div class="stg">' + (s.i+1) + ' / ' + s.n + '</div>' +
      '</div></div>';
    if(open) h += detailHTML(it);
  });
  box.innerHTML = h;
}

function detailHTML(it){
  const f = it.fields || {};
  let kv = '';
  (TYPES[it.type].fields).forEach(function(fd){
    if(fd.t==='rows') return;
    const v = f[fd.k];
    if(v===undefined || v===null || v==='') return;
    kv += '<div><b>' + esc(fd.l) + '</b>' + (fd.t==='textarea' ? nl(v) : esc(v)) + '</div>';
  });

  let tables = '';
  ['chapters','milestones','materials'].forEach(function(k){
    const rows = f[k]; const cols = ROWCOLS[k];
    if(!rows || !rows.length) return;
    tables += '<h4>' + (k==='chapters'?'章节进度':k==='milestones'?'关键节点':'相关资料') + '</h4>';
    tables += '<table class="mini"><tr>' + cols.map(function(c){ return '<th>'+esc(c.l)+'</th>'; }).join('') + '</tr>';
    rows.forEach(function(r){
      tables += '<tr>' + cols.map(function(c){
        const v = r[c.k];
        if(k==='materials' && c.k==='url' && v) return '<td><a href="'+esc(v)+'" target="_blank" rel="noopener">'+esc(v)+'</a></td>';
        return '<td>' + esc(v||'—') + '</td>';
      }).join('') + '</tr>';
    });
    tables += '</table>';
  });

  const tl = (it.timeline||[]).slice().reverse().map(function(t){
    return '<li><time>' + esc(t.date) + '</time>' + esc(t.text) + '</li>';
  }).join('');

  return '<div class="detail">' +
    (kv ? '<h4>基本信息</h4><div class="kv">' + kv + '</div>' : '') +
    tables +
    (tl ? '<h4>时间线</h4><ul class="tl">' + tl + '</ul>' : '') +
  '</div>';
}

function toggleOpen(id){ window._open = (window._open===id ? null : id); renderAll(); }

function advance(id){
  const it = DB.items.filter(function(x){ return x.id===id; })[0];
  if(!it) return;
  const s = stDef(it.type, it.status);
  if(s.i >= s.n-1){ toast('已是最终阶段', 'help'); return; }
  const next = TYPES[it.type].statuses[s.i+1];
  setStatus(it, next);
  logAct(it.title + ' — 推进到「' + next.n + '」');
  save(); renderAll(); toast('已推进到「' + next.n + '」', 'check');
}

function backOff(id){
  const it = DB.items.filter(function(x){ return x.id===id; })[0];
  if(!it) return;
  const s = stDef(it.type, it.status);
  if(s.i <= 0){ toast('已经在起始阶段', 'help'); return; }
  const prev = TYPES[it.type].statuses[s.i-1];
  setStatus(it, prev);
  logAct(it.title + ' — 撤回到「' + prev.n + '」');
  save(); renderAll(); toast('已撤回到「' + prev.n + '」', 'back');
}

function setStatus(it, stDefObj){
  const old = stDef(it.type, it.status).def.n;
  it.status = stDefObj.k;
  it.updatedAt = today();
  it.timeline = it.timeline || [];
  if(it.timeline.length > 80) it.timeline = it.timeline.slice(-80);
  it.timeline.push({date:today(), text:'状态「' + old + '」→「' + stDefObj.n + '」'});
  syncDeadlines(it);
}

function syncDeadlines(it){
  // 条目到达定稿状态时，自动勾掉与之关联的节点
  if(!isDone(it.type, it.status)) return;
  DB.deadlines.forEach(function(d){ if(d.itemId === it.id) d.done = true; });
}

function delItem(id){
  const it = DB.items.filter(function(x){ return x.id===id; })[0];
  if(!it) return;
  if(!confirm('确定删除「' + it.title + '」？此操作不可撤销。')) return;
  DB.items = DB.items.filter(function(x){ return x.id!==id; });
  DB.deadlines = DB.deadlines.filter(function(d){ return d.itemId!==id; });
  logAct('删除条目《' + it.title + '》');
  save(); renderAll(); toast('已删除', 'check');
}

/* ---------------- 弹窗：条目编辑 ---------------- */

function rowsFieldHTML(f, val){
  const cols = ROWCOLS[f.k];
  let h = '<div class="field f-full"><label>' + esc(f.l) + '</label>' +
          '<table class="rows-tbl"><thead><tr>';
  cols.forEach(function(c){ h += '<th style="width:' + (c.w||'auto') + '">' + esc(c.l) + '</th>'; });
  h += '<th style="width:28px"></th></tr></thead><tbody data-rows="' + f.k + '">';
  (val||[]).forEach(function(r){ h += rowHTML(f.k, r); });
  h += '</tbody></table>' +
       '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" data-act="add-row" data-key="' + f.k + '">＋ 添加行</button>' +
       (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '</div>';
  return h;
}

function rowHTML(key, r){
  const cols = ROWCOLS[key];
  let h = '<tr>';
  cols.forEach(function(c){
    const v = (r && r[c.k]) || '';
    if(c.t === 'select'){
      h += '<td><select data-c="' + c.k + '">' +
           ['<option value=""></option>'].concat(c.opts.map(function(o){
             return '<option' + (o===v?' selected':'') + '>' + esc(o) + '</option>';
           })).join('') + '</select></td>';
    } else {
      h += '<td><input data-c="' + c.k + '" type="' + (c.t||'text') + '" value="' + esc(v) + '"></td>';
    }
  });
  h += '<td><button type="button" class="x" data-act="rm-row">×</button></td></tr>';
  return h;
}

function addRow(btn, key){
  const tb = document.querySelector('[data-rows="' + key + '"]');
  tb.insertAdjacentHTML('beforeend', rowHTML(key, {}));
}

function fieldHTML(fd, v){
  if(fd.t === 'rows') return rowsFieldHTML(fd, v);
  const cls = 'field' + (fd.full ? ' f-full' : '');
  const req = fd.req ? ' <em>*</em>' : '';
  let ctrl;
  if(fd.t === 'textarea'){
    ctrl = '<textarea data-k="' + fd.k + '" rows="3">' + esc(v||'') + '</textarea>';
  } else if(fd.t === 'select'){
    ctrl = '<select data-k="' + fd.k + '">' +
      ['<option value=""></option>'].concat((fd.opts||[]).map(function(o){
        return '<option' + (o===v?' selected':'') + '>' + esc(o) + '</option>';
      })).join('') + '</select>';
  } else {
    ctrl = '<input data-k="' + fd.k + '" type="' + (fd.t||'text') + '"' +
           (fd.step ? ' step="' + fd.step + '"' : '') +
           ' value="' + esc(v==null?'':v) + '">';
  }
  return '<div class="' + cls + '"><label>' + esc(fd.l) + req + '</label>' + ctrl +
         (fd.hint ? '<div class="hint">' + esc(fd.hint) + '</div>' : '') + '</div>';
}

function openEditor(type, id){
  const it = id ? DB.items.filter(function(x){ return x.id===id; })[0] : null;
  const T = TYPES[type];
  const f = it ? (it.fields||{}) : {};
  const TIME_KEYS = ['submitDate','acceptDate','publishDate','filingDate','pubDate','grantDate','completionDate','regDate','releaseDate','planDate','year','nextAction'];
  let h = '<div class="mh"><h3>' + (it ? '编辑' : '新建') + T.label + '</h3>' +
          '<span class="en">' + T.en + '</span>' +
          '<button data-act="close-modal" aria-label="关闭">×</button></div>' +
          '<div class="grid2">';

  h += '<div class="form-sec">基本信息</div>';
  h += '<div class="field"><label>当前状态</label><select data-k="__status">' +
       T.statuses.map(function(s){
         return '<option value="' + s.k + '"' + (s.k === (it?it.status:'') ? ' selected' : '') + '>' + esc(s.n) + '</option>';
       }).join('') + '</select></div>';
  h += '<div class="field"><label>记录创建</label><input data-k="__createdAt" type="date" value="' + esc(it ? (it.createdAt||today()) : today()) + '"></div>';
  T.fields.forEach(function(fd){
    if(fd.t === 'rows' || TIME_KEYS.indexOf(fd.k) >= 0) return;
    if(fd.k === 'nextAction' || fd.k === 'planDate') return;
    h += fieldHTML(fd, f[fd.k]);
  });

  h += '<div class="form-sec">流程与时间</div>';
  T.fields.forEach(function(fd){
    if(TIME_KEYS.indexOf(fd.k) >= 0 || fd.k === 'nextAction' || fd.k === 'planDate') h += fieldHTML(fd, f[fd.k]);
  });

  h += '<div class="form-sec">资料与备注</div>';
  T.fields.forEach(function(fd){
    if(fd.t === 'rows') h += fieldHTML(fd, f[fd.k]);
    else if(fd.k === 'note') h += fieldHTML(fd, f[fd.k]);
  });

  h += '</div><div class="mf">' +
       '<button class="btn btn-primary" data-act="save-item" data-type="' + type + '"' + (id ? ' data-id="' + id + '"' : '') + '>保存</button>' +
       '<button class="btn btn-ghost" data-act="close-modal">取消</button></div>';

  $('#modal').innerHTML = h;
  $('#mask').classList.add('open');
  document.body.style.overflow = 'hidden';
  const first = $('#modal input[data-k="title"]');
  if(first) setTimeout(function(){ first.focus(); }, 60);
}

function closeModal(){
  $('#mask').classList.remove('open');
  document.body.style.overflow = '';
}

function readRows(key){
  const tb = document.querySelector('[data-rows="' + key + '"]');
  if(!tb) return [];
  return $$('tr', tb).map(function(tr){
    const o = {};
    $$('[data-c]', tr).forEach(function(inp){ o[inp.getAttribute('data-c')] = inp.value.trim(); });
    return o;
  }).filter(function(o){ return Object.keys(o).some(function(k){ return o[k]; }); });
}

function saveItem(type, id){
  const T = TYPES[type];
  const f = {};
  let statusVal = '', createdVal = today();

  $$('#modal [data-k]').forEach(function(inp){
    const k = inp.getAttribute('data-k');
    const v = (inp.value||'').trim();
    if(k === '__status'){ statusVal = v; return; }
    if(k === '__createdAt'){ createdVal = v || today(); return; }
    if(inp.type === 'number') f[k] = v === '' ? '' : Number(v);
    else f[k] = v;
  });
  T.fields.forEach(function(fd){ if(fd.t === 'rows') f[fd.k] = readRows(fd.k); });

  if(!f.title){ toast('请填写' + (T.fields[0].l || '标题')); return; }

  let it = id ? DB.items.filter(function(x){ return x.id===id; })[0] : null;
  const isNew = !it;
  if(isNew){
    it = { id:uid(), type:type, status:statusVal, fields:{}, timeline:[], createdAt:createdVal, updatedAt:today() };
    it.timeline.push({date:today(), text:'建立条目 · 状态「' + stDef(type, statusVal).def.n + '」'});
    DB.items.push(it);
  } else {
    const oldStatus = it.status;
    it.createdAt = createdVal;
    it.timeline = it.timeline || [];
    if(oldStatus !== statusVal){
      it.timeline.push({date:today(), text:'状态「' + stDef(type, oldStatus).def.n + '」→「' + stDef(type, statusVal).def.n + '」'});
    } else {
      it.timeline.push({date:today(), text:'更新条目信息'});
    }
    it.status = statusVal;
    it.updatedAt = today();
  }
  it.fields = f;
  it.title = f.title;
  it.updatedAt = today();
  syncDeadlines(it);
  logAct((isNew ? '新建' : '更新') + '条目《' + f.title + '》');

  save(); closeModal(); renderAll();
  toast(isNew ? '已新建「' + f.title + '」' : '已保存', 'check');
}

/* ---------------- 弹窗：时间节点 ---------------- */

const DL_TEMPLATES = [
  { label:'大修 90 天', title:'大修意见回复', days:90 },
  { label:'小修 30 天', title:'小修意见回复', days:30 },
  { label:'审稿回复 15 天', title:'审稿意见回复', days:15 },
  { label:'专利审查 15 天', title:'专利审查意见答复', days:15 },
  { label:'截稿 60 天', title:'期刊截稿', days:60 }
];

function openDeadlineEditor(id){
  const d = id ? DB.deadlines.filter(function(x){ return x.id===id; })[0] : null;
  const linkOpts = ['<option value="">不关联条目</option>'].concat(DB.items.map(function(x){
    return '<option value="' + x.id + '"' + (d && d.itemId === x.id ? ' selected' : '') + '>' +
           esc(TYPES[x.type].label + ' · ' + x.title) + '</option>';
  })).join('');
  const tpls = DL_TEMPLATES.map(function(t){
    return '<button type="button" data-act="dl-tpl" data-title="' + esc(t.title) + '" data-days="' + t.days + '">' +
           esc(t.label) + '</button>';
  }).join('');
  let h = '<div class="mh"><h3>' + (d ? '编辑节点' : '添加节点') + '</h3>' +
          '<span class="en">DEADLINE</span>' +
          '<button data-act="close-modal" aria-label="关闭">×</button></div>' +
          (d ? '' : '<div class="tpl-row">' + tpls + '<button type="button" data-act="dl-tpl" data-title="自定义节点" data-days="7">自定义 7 天</button></div>') +
          '<div class="grid2">' +
          '<div class="field f-full"><label>名称 <em>*</em></label><input data-d="title" value="' + esc(d?d.title:'') + '" placeholder="例：水力学期刊截稿 / 盲审意见返回 / 专利答复期限"></div>' +
          '<div class="field"><label>日期 <em>*</em></label><input data-d="date" type="date" value="' + esc(d?d.date:'') + '"></div>' +
          '<div class="field"><label>已完成</label><select data-d="done"><option value="0"' + (d&&d.done?'':' selected') + '>否</option><option value="1"' + (d&&d.done?' selected':'') + '>是</option></select></div>' +
          '<div class="field f-full"><label>关联条目</label><select data-d="itemId">' + linkOpts + '</select>' +
          '<div class="hint">关联后，条目到达「已定稿」状态会自动勾掉这个节点</div></div>' +
          '<div class="field f-full"><label>备注</label><input data-d="note" value="' + esc(d?d.note||'':'') + '"></div>' +
          '</div><div class="mf">' +
          '<button class="btn btn-primary" data-act="save-deadline"' + (id ? ' data-id="' + id + '"' : '') + '>保存</button>' +
          '<button class="btn btn-ghost" data-act="close-modal">取消</button></div>';
  $('#modal').innerHTML = h;
  $('#mask').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function applyDeadlineTemplate(btn){
  const title = btn.getAttribute('data-title') || '';
  const days = parseInt(btn.getAttribute('data-days'), 10) || 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  const ds = date.toISOString().slice(0,10);
  const ti = $('#modal [data-d="title"]');
  const di = $('#modal [data-d="date"]');
  if(ti) ti.value = title;
  if(di) di.value = ds;
  if(ti) ti.focus();
}

function saveDeadline(id){
  const o = {};
  $$('#modal [data-d]').forEach(function(i){ o[i.getAttribute('data-d')] = (i.value||'').trim(); });
  if(!o.title || !o.date){ toast('请填写名称和日期'); return; }
  let d = id ? DB.deadlines.filter(function(x){ return x.id===id; })[0] : null;
  if(!d){ d = {id:uid()}; DB.deadlines.push(d); }
  d.title = o.title; d.date = o.date; d.note = o.note; d.itemId = o.itemId || '';
  d.done = (o.done === '1');
  logAct('保存节点「' + o.title + '」');
  save(); closeModal(); renderAll(); toast('节点已保存', 'check');
}

function delDeadline(id){
  if(!confirm('删除这个时间节点？')) return;
  DB.deadlines = DB.deadlines.filter(function(x){ return x.id!==id; });
  logAct('删除时间节点');
  save(); renderAll();
}

/* ---------------- 快速录入 / 资料附件 ---------------- */

function quickAdd(){
  const type = $('#qcType').value;
  const title = ($('#qcTitle').value || '').trim();
  const due = $('#qcDue').value || '';
  if(!title){ $('#qcTitle').focus(); toast('先写上标题', 'help'); return; }
  const st = TYPES[type].statuses[0];
  const it = {
    id: uid(), type: type, status: st.k, fields: { title: title },
    title: title, timeline: [{date:today(), text:'建立条目 · 状态「' + st.n + '」'}],
    createdAt: today(), updatedAt: today()
  };
  DB.items.push(it);
  if(due){
    DB.deadlines.push({ id: uid(), title: title + ' · 截止', date: due, note: '快速录入关联', itemId: it.id, done: false });
  }
  window._lastItemId = it.id;
  logAct('快速录入《' + title + '》');
  $('#qcTitle').value = ''; $('#qcDue').value = '';
  save(); renderAll();
  toast('已录入「' + title + '」', 'check');
}

function attachFiles(){ /* 拖拽附件已移除 */ }

/* ---------------- 数据导入导出 ---------------- */

function exportJSON(){
  const name = 'research-hub-' + today() + '.json';
  downloadFile(name, JSON.stringify(DB, null, 2), 'application/json');
  logAct('导出备份 ' + name);
  save();
  toast('已导出 ' + name, 'check');
}

function importJSON(input){
  const file = input.files && input.files[0];
  input.value = '';
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(){
    try{
      const obj = JSON.parse(reader.result);
      if(!obj || !Array.isArray(obj.items)) throw new Error('格式不正确');
      if(!confirm('导入将覆盖当前全部数据（' + DB.items.length + ' 条 → ' + obj.items.length + ' 条），确定继续？')) return;
      DB = Object.assign(blank(), obj);
      DB.seedDone = true;
      logAct('导入备份成功');
      save(); renderAll(); toast('导入成功', 'check');
    }catch(e){ toast('导入失败：' + e.message, 'warn'); }
  };
  reader.readAsText(file, 'utf-8');
}

/* ---------------- 简历墙 ---------------- */

let R_OPT = { lang:'zh', fmt:'text', scope:'done', groupBy:'type', skin:'s1' };

function initSegments(){
  [['#segLang','lang'],['#segFmt','fmt'],['#segScope','scope'],['#segSkin','skin']].forEach(function(pair){
    $$(pair[0] + ' button').forEach(function(b){
      b.onclick = function(){
        $$(pair[0] + ' button').forEach(function(x){ x.classList.remove('on'); });
        b.classList.add('on');
        R_OPT[pair[1]] = b.getAttribute('data-v');
        renderResume();
      };
    });
  });
  $('#groupBy').onchange = function(){ R_OPT.groupBy = this.value; renderResume(); };
}

function pickVal(it, zhKey, enKey){
  const f = it.fields || {};
  return R_OPT.lang === 'en' ? (f[enKey] || f[zhKey] || '') : (f[zhKey] || '');
}

/* 署名：条目里没写发明人/作者时，用「简历墙 · 署名」里填的姓名 */
function meName(){
  return R_OPT.lang === 'en' ? (DB.profile.nameEn || DB.profile.name || '') : (DB.profile.name || '');
}
function refNum(i){ return '[' + i + '] '; }

function paperLine(it, i){
  const f  = it.fields;
  const en = R_OPT.lang === 'en';
  const authors = en ? (f.authorsEn || f.authors || '') : (f.authors || '');
  const title   = en ? (f.titleEn  || f.title  || '') : (f.title  || '');
  const venue   = en ? (f.venueEn  || f.venue  || '') : (f.venue  || '');
  const year    = f.year || '';
  const vol     = f.vol  || '';
  const st      = en ? EN_STATUS.paper[it.status] : stDef('paper', it.status).def.n;
  const tags    = [f.myRank, f.partition, (f.ifVal ? 'IF ' + f.ifVal : ''), st].filter(Boolean);

  if(R_OPT.fmt === 'bul'){
    const bits = [venue || (en ? 'Paper' : '期刊论文'), f.partition,
                  (f.ifVal ? 'IF ' + f.ifVal : ''), f.myRank, st, year].filter(Boolean);
    return '• ' + bits.join('｜') + '｜' + title;
  }
  let base = en
    ? refNum(i) + authors + ', "' + title + '," ' + venue
    : refNum(i) + authors + '. ' + title + '[J]. ' + venue;
  if(year) base += ', ' + year;
  if(vol)  base += ', ' + vol;
  base += '.';
  if(R_OPT.fmt === 'gb' && f.doi) base += ' DOI: ' + f.doi + '.';
  if(R_OPT.fmt === 'text' && tags.length) base += ' (' + tags.join(' · ') + ')';
  return base;
}

function thesisLine(it, i){
  const f = it.fields;
  const title = pickVal(it, 'title', 'titleEn');
  const school = f.school || '';
  const year = f.year || '';
  const deg = f.degree === '博士' ? '博士' : '硕士';
  const degEn = f.degree === '博士' ? 'Ph.D. dissertation' : 'Master\'s thesis';
  if(R_OPT.fmt === 'bul'){
    return '• ' + [deg+'学位论文', school, year, title].filter(Boolean).join('｜');
  }
  const who = meName();
  if(R_OPT.lang === 'en'){
    return refNum(i) + (who ? who + ', ' : '') + '"' + title + '," ' + degEn +
           (school ? ', ' + school : '') + (year ? ', ' + year : '') + '.';
  }
  return refNum(i) + (who ? who + '. ' : '') + deg + '学位论文：' + title + '[D]. ' +
         school + (year ? ', ' + year : '') + '.';
}

function patentLine(it, i){
  const f = it.fields;
  const title = pickVal(it, 'title', 'titleEn');
  const st = R_OPT.lang === 'en' ? EN_STATUS.patent[it.status] : stDef('patent', it.status).def.n;
  const kind = f.patentType || '发明专利';
  const kindEn = kind === '实用新型' ? 'Utility Model' : (kind === '外观设计' ? 'Design Patent' : 'Invention Patent');
  // 实审仅在「全部」范围出现，条目内显式标注
  const substNote = (it.status === 'subst') ? (R_OPT.lang === 'en' ? 'Under substantive examination' : '实质审查') : '';
  const tags = [f.myRank, st, substNote].filter(Boolean);
  if(R_OPT.fmt === 'bul'){
    return '• ' + [kind, f.myRank, st, title].filter(Boolean).join('｜');
  }
  if(R_OPT.lang === 'en'){
    const who = f.inventors || meName() || '';
    let s = refNum(i) + who + ', "' + title + '," Chinese ' + kindEn;
    if(f.applicationNo) s += ', App. No. ' + f.applicationNo;
    if(f.filingDate) s += ', ' + f.filingDate;
    s += '.';
    if(tags.length && R_OPT.fmt==='text') s += ' (' + tags.join(' · ') + ')';
    return s;
  }
  let s = refNum(i) + (f.inventors||'') + '. ' + title + '[P]. 中国' + kind;
  if(f.applicationNo) s += ', 申请号 ' + f.applicationNo;
  if(f.filingDate) s += ', ' + f.filingDate;
  s += '.';
  if(f.grantNo) s += ' 专利号 ' + f.grantNo + '.';
  if(tags.length && R_OPT.fmt==='text') s += ' (' + tags.join(' · ') + ')';
  return s;
}

function copyrightLine(it, i){
  const f = it.fields;
  const title = f.title + (f.version ? ' ' + f.version : '');
  const st = R_OPT.lang === 'en' ? EN_STATUS.copyright[it.status] : stDef('copyright', it.status).def.n;
  const tags = [f.myRank, st].filter(Boolean);
  if(R_OPT.fmt === 'bul'){
    return '• ' + ['软件著作权', f.myRank, st, title].filter(Boolean).join('｜');
  }
  const who = meName();
  if(R_OPT.lang === 'en'){
    let s = refNum(i) + (who ? who + ', ' : '') + '"' + f.title + (f.version ? ' ' + f.version : '') + '," Computer Software Copyright';
    if(f.regNo) s += ', Reg. No. ' + f.regNo;
    if(f.regDate) s += ', ' + f.regDate;
    s += '.';
    if(tags.length && R_OPT.fmt==='text') s += ' (' + tags.join(' · ') + ')';
    return s;
  }
  let s = refNum(i) + (who ? who + '. ' : '') + title + '[CP].';
  if(f.regNo) s += ' 登记号 ' + f.regNo;
  if(f.regDate) s += ', ' + f.regDate;
  s += '.';
  if(tags.length && R_OPT.fmt==='text') s += ' (' + tags.join(' · ') + ')';
  return s;
}

function softwareLine(it, i){
  const f = it.fields;
  const title = pickVal(it, 'title', 'titleEn');
  if(R_OPT.fmt === 'bul'){
    return '• ' + ['软件成果', f.role, title, f.version, f.releaseDate].filter(Boolean).join('｜');
  }
  let s = refNum(i) + title + (f.version ? ' ' + f.version : '');
  if(f.role) s += ' — ' + f.role;
  if(f.myRank && f.myRank !== f.role) s += '（' + f.myRank + '）';
  if(f.techStack) s += ' · ' + f.techStack;
  if(f.liveUrl) s += ' · ' + f.liveUrl;
  else if(f.repoUrl) s += ' · ' + f.repoUrl;
  if(f.releaseDate) s += ' · ' + f.releaseDate;
  return s;
}

const LINERS = { paper:paperLine, thesis:thesisLine, patent:patentLine, copyright:copyrightLine, software:softwareLine };

/* 资料清单：把每条成果挂的文件 / 链接汇总出来，方便做简历时直接拿材料 */
function materialLine(it, i){
  const mats = (it.fields || {}).materials || [];
  const st = R_OPT.lang === 'en' ? EN_STATUS[it.type][it.status] : stDef(it.type, it.status).def.n;
  let s = refNum(i) + it.title + '（' + TYPES[it.type].label + (st ? ' · ' + st : '') + '）';
  if(!mats.length) return s + '\n    （暂无资料）';
  s += '\n' + mats.map(function(m){
    return '    · ' + (m.name || '未命名') + (m.url ? ' — ' + m.url : '');
  }).join('\n');
  return s;
}

const SECT = {
  paper:    {zh:'学术论文',        en:'Publications'},
  thesis:   {zh:'学位论文',        en:'Dissertations'},
  patent:   {zh:'发明专利',        en:'Patents'},
  copyright:{zh:'软件著作权',      en:'Software Copyrights'},
  software: {zh:'软件成果',        en:'Software Projects'}
};

function resumeItems(){
  // 「仅已定稿」不含实审；「全部」含实审（条目内标注）
  return DB.items.filter(function(it){
    return R_OPT.scope === 'all' || isDone(it.type, it.status);
  });
}

function itemYear(it){
  const f = it.fields || {};
  return String(f.year || f.regDate || f.filingDate || f.releaseDate || f.grantDate || it.createdAt || '').slice(0,4);
}
function sortByYear(list){
  list.sort(function(a,b){ return itemYear(b).localeCompare(itemYear(a)); });
  return list;
}

function buildResumeText(){
  const items = resumeItems();
  const fmt = R_OPT.fmt, lang = R_OPT.lang;
  const out = [];

  function section(title, list, type){
    if(!list.length) return;
    out.push(title, '');
    sortByYear(list);
    list.forEach(function(it, i){ out.push(LINERS[type](it, i+1)); });
    out.push('');
  }
  const ORDER = ['paper','thesis','patent','copyright','software'];

  if(R_OPT.fmt === 'mat'){
    const list = sortByYear(items.slice());
    out.push('══ 资料清单 / Materials ══', '');
    if(!list.length) out.push('（当前筛选条件下没有成果）');
    list.forEach(function(it, i){ out.push(materialLine(it, i+1)); out.push(''); });
  } else if(R_OPT.groupBy === 'year' || R_OPT.skin === 's4'){
    const years = {};
    items.forEach(function(it){
      const y = itemYear(it) || '未定年份';
      (years[y] = years[y] || []).push(it);
    });
    Object.keys(years).sort().reverse().forEach(function(y){
      out.push('══ ' + y + ' ══', '');
      ORDER.forEach(function(t){
        const list = years[y].filter(function(x){ return x.type===t; });
        if(!list.length) return;
        sortByYear(list);
        list.forEach(function(it, i){ out.push(LINERS[t](it, i+1)); });
        out.push('');
      });
    });
  } else if(lang === 'both'){
    ORDER.forEach(function(t){
      const list = items.filter(function(x){ return x.type===t; });
      if(!list.length) return;
      sortByYear(list);
      out.push('── ' + SECT[t].zh + ' / ' + SECT[t].en + ' ──', '');
      const saved = R_OPT.lang;
      R_OPT.lang = 'zh';
      list.forEach(function(it, i){ out.push(LINERS[t](it, i+1)); });
      out.push('');
      R_OPT.lang = 'en';
      list.forEach(function(it, i){ out.push(LINERS[t](it, i+1)); });
      out.push('');
      R_OPT.lang = saved;
    });
  } else {
    ORDER.forEach(function(t){
      const nm = lang === 'en' ? SECT[t].en : SECT[t].zh;
      section(nm, items.filter(function(x){ return x.type===t; }), t);
    });
  }

  if(!out.length) out.push('（当前筛选条件下没有可导出的成果）');

  const head = R_OPT.scope === 'done'
    ? '只包含已定稿成果（录用 / 见刊 / 授权 / 已登记 / 已发布）'
    : '包含全部成果（含进行中）';
  const n = items.length;
  const tip = (R_OPT.scope === 'done' && n > 0 && n < DB.items.length)
    ? '\n提示：另有 ' + (DB.items.length - n) + ' 条进行中的成果未列入，切到「全部」可见。'
    : (n === 0 ? '\n提示：先到上面几个分区录入成果，或切到「全部」查看。' : '');
  return '科研成果汇总' + (lang==='en' ? ' / Research Output' : '') + '\n' +
         '生成日期 ' + today() + ' · ' + head + tip + '\n\n' +
         out.join('\n');
}

function renderResume(){
  const text = buildResumeText();
  const lines = text.split('\n');
  const isItem = function(ln){ return /^\d+\.\s|^\[[0-9]+\]|^•/.test(ln); };
  const isMeta = function(ln){ return /生成日期|只包含|包含全部|提示：|^科研成果汇总/.test(ln); };
  let h = '';
  let open = false;
  function closeSec(){ if(open){ h += '</div></section>'; open = false; } }
  lines.forEach(function(ln, idx){
    if(!ln.trim()) return;
    if(isMeta(ln)){
      if(!open) h += '<div class="rhead">' + esc(ln) + '</div>';
      else h += '<div class="rcont">' + esc(ln) + '</div>';
      return;
    }
    if(/^[═─]/.test(ln) || (!isItem(ln) && ln.trim().length < 24 && ln.indexOf('　') !== 0 && ln[0] !== ' ')){
      // 板块标题
      const title = ln.replace(/^[═─\s]+|[═─\s]+$/g, '').replace(/\s*\/\s*.*$/, '');
      closeSec();
      h += '<section class="rsec"><h3>' + esc(title || ln.trim()) + '</h3><div class="rbody">';
      open = true;
      return;
    }
    if(!open){
      h += '<section class="rsec"><h3></h3><div class="rbody">';
      open = true;
    }
    if(isItem(ln)) h += '<div class="ritem">' + esc(ln) + '</div>';
    else h += '<div class="rcont">' + esc(ln) + '</div>';
  });
  closeSec();
  const box = $('#resumeOut');
  box.className = 'resume-out skin-' + (R_OPT.skin || 's1');
  box.innerHTML = h || '<div class="rhead">' + esc(text) + '</div>';
}

function initProfile(){
  const zh = $('#profileName'), en = $('#profileNameEn');
  zh.value = DB.profile.name || '';
  en.value = DB.profile.nameEn || '';
  function upd(){
    DB.profile.name   = zh.value.trim();
    DB.profile.nameEn = en.value.trim();
    save(); renderResume(); renderIdentityClock(); renderMap();
  }
  zh.oninput = upd; en.oninput = upd;
}
function copyResume(){ copyText(buildResumeText()); }
function downloadResume(){ downloadFile('科研成果汇总-' + today() + '.txt', buildResumeText()); }

function downloadResumeHTML(){
  const inner = $('#resumeOut').innerHTML;
  const skin = R_OPT.skin || 's1';
  const css = [
    'body{margin:0;background:#FAF7F5;color:#213547;font-family:"MiSans","PingFang SC","Microsoft YaHei",sans-serif;}',
    '.page{max-width:820px;margin:24px auto;background:#fff;border:1px solid #000;border-top:3px solid #000;padding:40px 44px;}',
    '.rhead{font-size:13px;color:#666;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #E5E7EB;}',
    '.rsec{display:flex;gap:20px;padding:16px 0;border-bottom:1px solid #E5E7EB;}',
    '.rsec:last-child{border-bottom:none;}',
    '.rsec h3{width:110px;flex:none;font-size:15px;font-weight:700;color:#000;margin:0;padding-left:12px;border-left:3px solid #000;}',
    '.rbody{flex:1;min-width:0;}',
    '.ritem{font-size:14.5px;line-height:1.85;padding:6px 0;white-space:pre-wrap;}',
    '.rcont{font-size:13.5px;color:#333;line-height:1.75;padding:2px 0 2px 12px;white-space:pre-wrap;}',
    skin === 's2' ? '.page{padding:24px 28px;}.rsec{display:block;padding:10px 0;}.rsec h3{width:auto;border:none;padding:0;font-size:14px;margin-bottom:6px;}.ritem{font-size:13px;line-height:1.55;padding:3px 0;}' : '',
    skin === 's3' ? '.rsec h3{width:150px;}.ritem{font-size:15px;}' : '',
    skin === 's4' ? '.rsec h3{width:80px;font-size:16px;}.rsec{align-items:flex-start;}' : '',
    '@media print{body{background:#fff;}.page{border:none;margin:0;padding:0;}}'
  ].join('\n');
  const html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<title>科研成果汇总 - ' + today() + '</title>\n<style>\n' + css + '\n</style>\n</head>\n<body>\n' +
    '<div class="page skin-' + skin + '">' + inner + '</div>\n</body>\n</html>\n';
  downloadFile('科研成果汇总-' + today() + '.html', html, 'text/html;charset=utf-8');
  toast('已下载 HTML 简历', 'check');
}

/* ---------------- 总渲染 ---------------- */

function renderAll(){
  renderStats();
  renderWipList();
  renderAchTimeline();
  renderIdentityClock();
  renderMap();
  renderDeadlines();
  renderActivity();
  renderAlert();
  Object.keys(TYPES).forEach(renderList);
  renderResume();
}

/* ---------------- 事件委托 ---------------- */

function bindEvents(){
  document.addEventListener('click', function(e){
    const t = e.target.closest('[data-act]');
    if(!t) return;
    const act = t.getAttribute('data-act');
    const id = t.getAttribute('data-id');
    const type = t.getAttribute('data-type');

    if(act === 'export') return exportJSON();
    if(act === 'import'){ $('#fileIn').click(); return; }
    if(act === 'import-file') return importJSON(t);
    if(act === 'burger'){ $('#drawer').classList.toggle('open'); return; }
    if(act === 'view'){ e.preventDefault(); return showView(t.getAttribute('data-view')); }
    if(act === 'dismiss-alert') return dismissAlert();
    if(act === 'jump') return jumpTo(type);
    if(act === 'toggle') return toggleOpen(id);
    if(act === 'advance') return advance(id);
    if(act === 'back') return backOff(id);
    if(act === 'del') return delItem(id);
    if(act === 'edit') return openEditor(type, id);
    if(act === 'edit-new') return openEditor(type, null);
    if(act === 'close-modal') return closeModal();
    if(act === 'save-item') return saveItem(type, id || null);
    if(act === 'deadline-new') return openDeadlineEditor(null);
    if(act === 'deadline-edit') return openDeadlineEditor(id);
    if(act === 'deadline-del') return delDeadline(id);
    if(act === 'save-deadline') return saveDeadline(id || null);
    if(act === 'notify') return askNotify();
    if(act === 'quick-add') return quickAdd();
    if(act === 'copy-resume') return copyResume();
    if(act === 'download-resume') return downloadResume();
    if(act === 'download-resume-html') return downloadResumeHTML();
    if(act === 'print') return window.print();
    if(act === 'add-row') return addRow(t, t.getAttribute('data-key'));
    if(act === 'rm-row'){ const tr = t.closest('tr'); if(tr) tr.remove(); return; }
    if(act === 'tl-item'){
      window._tlMode = 'item';
      window._tlItemId = id;
      return renderAchTimeline();
    }
    if(act === 'tl-back'){
      e.preventDefault();
      window._tlMode = 'all';
      window._tlItemId = null;
      return renderAchTimeline();
    }
    if(act === 'map-filter'){
      const ft = t.getAttribute('data-type');
      const keys = (t.getAttribute('data-keys') || '').split(',').filter(Boolean);
      const label = t.getAttribute('data-label') || '';
      window._listFilter = { type: ft, keys: keys, label: label, view: ft };
      return showView(ft);
    }
    if(act === 'filter-clear'){
      window._listFilter = null;
      return renderAll();
    }
    if(act === 'dl-tpl') return applyDeadlineTemplate(t);
    if(act === 'focus-key'){
      if(e.key === 'Enter' || e.key === ' ') { /* handled in keydown */ }
    }
  });

  // 键盘：Enter / Space 触发 data-act 的非表单控件
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest('[data-act][tabindex]');
    if(!t) return;
    if(t.tagName === 'BUTTON' || t.tagName === 'A' || t.tagName === 'INPUT') return;
    e.preventDefault();
    t.click();
  });

  $('#qcTitle').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); quickAdd(); }
  });
  $('#fileIn').addEventListener('change', function(){ importJSON(this); });

  const segTl = $('#segTl');
  if(segTl){
    segTl.addEventListener('click', function(e){
      const b = e.target.closest('[data-tl]');
      if(!b) return;
      $$('#segTl button').forEach(function(x){ x.classList.toggle('on', x===b); });
      window._tlFilter = b.getAttribute('data-tl');
      window._tlMode = 'all';
      window._tlItemId = null;
      renderAchTimeline();
    });
  }
}

/* ---------------- 启动 ---------------- */

document.addEventListener('DOMContentLoaded', function(){
  loadDB();
  renderHeroBg();
  initSegments();
  initProfile();
  bindEvents();
  renderAll();
  showView((location.hash || '').replace('#','') || 'dash');
  tickClock();
  setInterval(tickClock, 1000);

  $('#mask').addEventListener('click', function(e){ if(e.target === this) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
});
