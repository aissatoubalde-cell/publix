(function(){
  var $=function(id){return document.getElementById(id)};
  /* menu mobile */
  [].forEach.call(document.querySelectorAll(".drawer a"),function(a){a.addEventListener("click",function(){var b=document.querySelector(".burger");if(b)b.open=false})});

  /* vidéo (page Réalisations) */
  var vid=$("vid");
  if(vid){
    var play=function(){vid.scrollIntoView({behavior:"smooth",block:"center"});var p=vid.play();if(p&&p.catch)p.catch(function(){})};
    if($("openVid"))$("openVid").addEventListener("click",play);
    var pc=document.querySelector(".card .play");if(pc)pc.parentNode.addEventListener("click",play);
  }

  /* formulaire de contact */
  var f=$("f");
  /* particulier ou entreprise : le champ "Nom de l'entreprise" n'apparaît que pour une entreprise */
  var isEnt=function(){var r=$("profil-ent");return !r||r.checked};
  var sw=$("societe-wrap");
  if(f&&sw){var sync=function(){sw.hidden=!isEnt()};[].forEach.call(f.querySelectorAll('input[name="profil"]'),function(r){r.addEventListener("change",sync)});sync()}
  if(f)f.addEventListener("submit",function(e){
    e.preventDefault();var m=$("fmsg"),n=$("nom");m.hidden=false;
    if(!n.value.trim()){m.textContent="Indiquez votre nom pour que nous puissions vous répondre.";n.focus();return}
    var g=function(id){return $(id).value.trim()};
    var body="Profil : "+(isEnt()?"Entreprise":"Particulier")+"\nNom : "+g("nom")+(isEnt()?"\nEntreprise : "+g("societe"):"")+"\nTéléphone : "+g("tel")+"\nBesoin : "+g("besoin")+"\n\n"+g("projet");
    m.textContent="Votre messagerie s'ouvre avec la demande prête à envoyer. Sinon, écrivez-nous à infos@publix360.net ou au +224 610 30 00 00.";
    location.href="mailto:infos@publix360.net?subject="+encodeURIComponent("Demande de projet – "+g("besoin"))+"&body="+encodeURIComponent(body);
  });


  /* ===== effets ===== */
  var reduceFx=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* barre de progression, menu resserré, bouton retour en haut */
  var bar=document.createElement("div");bar.className="progress";bar.setAttribute("aria-hidden","true");document.body.appendChild(bar);
  var top=document.createElement("button");top.className="totop";top.type="button";top.setAttribute("aria-label","Revenir en haut de la page");
  top.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  top.addEventListener("click",function(){window.scrollTo({top:0,behavior:reduceFx?"auto":"smooth"})});document.body.appendChild(top);
  var nav=document.querySelector(".nav"),ticking=false;
  function onScroll(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight,y=window.scrollY;
    bar.style.setProperty("--p",max>0?(y/max).toFixed(4):0);
    if(nav)nav.classList.toggle("scrolled",y>40);top.classList.toggle("show",y>600);ticking=false}
  window.addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();
  /* halo qui suit la souris */
  [].forEach.call(document.querySelectorAll(".sd-card,.card,.post"),function(el){
    el.addEventListener("mousemove",function(e){var r=el.getBoundingClientRect();el.style.setProperty("--mx",(e.clientX-r.left)+"px");el.style.setProperty("--my",(e.clientY-r.top)+"px")});
  });
  /* apparition au défilement */
  if("IntersectionObserver" in window&&!reduceFx){
    var groups=[".services li",".sd-card",".card",".feature-vid",".post",".p-logo",".p-cta",".about-img",".about-copy",".value",".title-rule",".partners-sub",".contact form",".quote-band blockquote",".ct-intro",".wl-title",".wl-lead",".wl-text",".offer-item",".rz-item",".rz-head",".mvv-card"];
    var vh=window.innerHeight;
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var t=e.target;t.classList.remove("rv-pre");t.classList.add("rv-in");ro.unobserve(t);t.addEventListener("animationend",function(){t.classList.remove("rv-in");t.style.removeProperty("--rd")},{once:true})}})},{threshold:.12});
    groups.forEach(function(sel){[].forEach.call(document.querySelectorAll(sel),function(el,i){
      if(el.closest(".track"))return;
      if(el.getBoundingClientRect().top>vh){el.classList.add("rv-pre");el.style.setProperty("--rd",(i%6)*0.08+"s");ro.observe(el)}
    })});
  }


  /* ===== effets : mot du directeur & équipe ===== */
  (function(){
    var secs=[].slice.call(document.querySelectorAll(".director,.team"));
    if(!secs.length)return;
    var fine=matchMedia("(hover: hover) and (pointer: fine)").matches;
    if("IntersectionObserver" in window&&!reduceFx){
      var vh=window.innerHeight;
      var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove("fx-wait");e.target.classList.add("fx-on");so.unobserve(e.target)}})},{threshold:.18});
      secs.forEach(function(s){if(s.getBoundingClientRect().top>vh*0.85){s.classList.add("fx-wait");so.observe(s)}else{s.classList.add("fx-on")}});
    }else{secs.forEach(function(s){s.classList.add("fx-on")})}
    /* inclinaison 3D qui suit la souris */
    if(fine&&!reduceFx){
      [].forEach.call(document.querySelectorAll(".dir-photo,.tm-photo-lg"),function(el){
        el.addEventListener("mousemove",function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
          el.style.setProperty("--rx",(-y*8).toFixed(2)+"deg");el.style.setProperty("--ry",(x*10).toFixed(2)+"deg");
          el.style.setProperty("--gx",((x+.5)*100).toFixed(1)+"%");el.style.setProperty("--gy",((y+.5)*100).toFixed(1)+"%")});
        el.addEventListener("mouseleave",function(){el.style.setProperty("--rx","0deg");el.style.setProperty("--ry","0deg")});
      });
    }
  })();


  /* équipe : fenêtre de présentation */
  (function(){
    var trig=[].slice.call(document.querySelectorAll(".tm-trigger")),md=$("tmModal");
    if(!trig.length||!md)return;
    var cur=0,last=null;
    function show(k){cur=(k+trig.length)%trig.length;var fig=trig[cur].closest(".tm-member"),im=trig[cur].querySelector("img");
      $("tmmImg").src=im.src;$("tmmImg").alt=im.alt;$("tmmImg").style.objectPosition=im.style.objectPosition||"center 20%";
      $("tmmName").textContent=fig.querySelector("h3").textContent;$("tmmRole").textContent=fig.querySelector(".tm-role").textContent;
      $("tmmText").innerHTML=fig.querySelector(".tm-bio").innerHTML;$("tmmCount").textContent=(cur+1)+" / "+trig.length;
      md.querySelector(".tmm-body").scrollTop=0}
    function open(k){last=document.activeElement;show(k);md.hidden=false;document.body.style.overflow="hidden";$("tmmClose").focus()}
    function close(){md.hidden=true;document.body.style.overflow="";if(last)last.focus()}
    trig.forEach(function(t,i){t.addEventListener("click",function(){open(i)})});
    $("tmmClose").addEventListener("click",close);
    $("tmmPrev").addEventListener("click",function(){show(cur-1)});
    $("tmmNext").addEventListener("click",function(){show(cur+1)});
    md.addEventListener("click",function(e){if(e.target===md)close()});
    document.addEventListener("keydown",function(e){if(md.hidden)return;if(e.key==="Escape")close();if(e.key==="ArrowLeft")show(cur-1);if(e.key==="ArrowRight")show(cur+1)});
  })();


  /* ===== EFFETS + ===== */
  (function(){
    if(reduceFx)return;
    var fine=matchMedia("(hover: hover) and (pointer: fine)").matches;
    /* particules aux couleurs du logo dans l'accueil et les bandeaux */
    [].forEach.call(document.querySelectorAll(".hero,.page-head"),function(host){
      var cv=document.createElement("canvas");cv.className="fx-canvas";cv.setAttribute("aria-hidden","true");host.insertBefore(cv,host.firstChild);
      var cx=cv.getContext("2d"),W,H,dpr=Math.min(window.devicePixelRatio||1,2),pts=[],cols=["255,85,119","210,26,71","173,6,50","255,255,255"];
      function size(){W=host.clientWidth;H=host.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
        var n=Math.round(Math.min(70,W*H/16000));pts=[];for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.4,vx:(Math.random()-.5)*.25,vy:-(Math.random()*.35+.08),c:cols[i%4],a:Math.random()*.6+.2})}
      size();window.addEventListener("resize",size);
      var mx=-999,my=-999;host.addEventListener("mousemove",function(e){var r=host.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top});host.addEventListener("mouseleave",function(){mx=my=-999});
      var vis=true;if("IntersectionObserver" in window){new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(host)}
      (function loop(){requestAnimationFrame(loop);if(!vis||document.hidden)return;cx.clearRect(0,0,W,H);
        for(var i=0;i<pts.length;i++){var p=pts[i];p.x+=p.vx;p.y+=p.vy;if(p.y<-5){p.y=H+5;p.x=Math.random()*W}if(p.x<-5)p.x=W+5;if(p.x>W+5)p.x=-5;
          var dx=p.x-mx,dy=p.y-my,d=Math.sqrt(dx*dx+dy*dy);if(d<110){p.x+=dx/d*1.2;p.y+=dy/d*1.2}
          cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fillStyle="rgba("+p.c+","+p.a+")";cx.fill();
          for(var j=i+1;j<pts.length;j++){var q=pts[j],ex=p.x-q.x,ey=p.y-q.y,e=ex*ex+ey*ey;if(e<9000){cx.strokeStyle="rgba(210,26,71,"+(.16*(1-e/9000))+")";cx.lineWidth=.6;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(q.x,q.y);cx.stroke()}}}
      })();
    });
    /* traits des titres qui se dessinent */
    if("IntersectionObserver" in window){var vh=innerHeight;var to=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove("tr-wait");to.unobserve(e.target)}})},{threshold:.5});
      [].forEach.call(document.querySelectorAll(".title-rule"),function(t){if(t.getBoundingClientRect().top>vh*.9){t.classList.add("tr-wait");to.observe(t)}})}
    if(fine){
      /* halo qui suit la souris */
      var g=document.createElement("div");g.className="cursor-glow";g.setAttribute("aria-hidden","true");document.body.appendChild(g);
      var gx=-999,gy=-999,tx=-999,ty=-999;window.addEventListener("mousemove",function(e){tx=e.clientX;ty=e.clientY},{passive:true});
      (function follow(){gx+=(tx-gx)*.12;gy+=(ty-gy)*.12;g.style.transform="translate3d("+gx+"px,"+gy+"px,0)";requestAnimationFrame(follow)})();
      /* boutons aimantés */
      [].forEach.call(document.querySelectorAll(".btn-hot,.btn-line,.sq-btn,.fwa"),function(b){
        b.addEventListener("mousemove",function(e){var r=b.getBoundingClientRect();b.style.transform="translate("+((e.clientX-r.left-r.width/2)*.18).toFixed(1)+"px,"+((e.clientY-r.top-r.height/2)*.3).toFixed(1)+"px)"});
        b.addEventListener("mouseleave",function(){b.style.transform=""});
      });
      /* logo de l'accueil qui suit légèrement la souris */
      var art=document.querySelector(".hero-art"),hero=document.querySelector(".hero");
      if(art&&hero){hero.addEventListener("mousemove",function(e){var r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;art.style.transform="translate("+(x*22).toFixed(1)+"px,"+(y*16).toFixed(1)+"px)"});hero.addEventListener("mouseleave",function(){art.style.transform=""})}
    }
  })();

  /* partenaires : défilement automatique à partir de 6 logos, sinon rangée centrée */
  var pt=$("ptrack");
  if(pt){var pl=[].slice.call(pt.children);
    if(pl.length<6){pt.classList.add("static")}
    else{pl.forEach(function(n){var c=n.cloneNode(true);c.setAttribute("aria-hidden","true");pt.appendChild(c)})}}

  /* galerie : apparition, inclinaison, visionneuse */
  var items=[].slice.call(document.querySelectorAll(".g-item"));
  var lb=$("lb");
  if(!items.length||!lb)return;
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if("IntersectionObserver" in window&&!reduce){
    var vh=window.innerHeight;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove("pre");e.target.classList.add("show");io.unobserve(e.target);e.target.addEventListener("animationend",function(){this.classList.remove("show")},{once:true})}})},{threshold:.15});
    items.forEach(function(el,i){if(el.getBoundingClientRect().top>vh){el.classList.add("pre");el.style.setProperty("--d",(i%4)*0.09+"s");io.observe(el)}});
  }
  if(!reduce&&matchMedia("(hover: hover)").matches){
    items.forEach(function(el){
      el.addEventListener("mousemove",function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform="rotateY("+(x*7)+"deg) rotateX("+(-y*7)+"deg) translateZ(0)"});
      el.addEventListener("mouseleave",function(){el.style.transform=""});
    });
  }
  var lbImg=$("lbImg"),lbCap=$("lbCap"),lbCount=$("lbCount"),lbDots=$("lbDots"),cur=0,last=null;
  items.forEach(function(){lbDots.appendChild(document.createElement("i"))});
  function show(k){
    cur=(k+items.length)%items.length;var im=items[cur].querySelector("img");
    lbImg.src=im.src;lbImg.alt=im.alt;lbImg.style.animation="none";void lbImg.offsetWidth;lbImg.style.animation="";
    lbCap.textContent=items[cur].querySelector("b").textContent;lbCount.textContent=(cur+1)+" / "+items.length;
    [].forEach.call(lbDots.children,function(d,i){d.classList.toggle("on",i===cur)});
  }
  function lbOpen(k){last=document.activeElement;show(k);lb.hidden=false;document.body.style.overflow="hidden";$("lbClose").focus()}
  function lbClose(){lb.hidden=true;document.body.style.overflow="";if(last)last.focus()}
  items.forEach(function(el,i){el.addEventListener("click",function(){lbOpen(i)})});
  $("lbClose").addEventListener("click",lbClose);
  $("lbPrev").addEventListener("click",function(){show(cur-1)});
  $("lbNext").addEventListener("click",function(){show(cur+1)});
  $("lbStage").addEventListener("click",function(e){if(e.target.id==="lbStage")lbClose()});
  document.addEventListener("keydown",function(e){if(lb.hidden)return;if(e.key==="Escape")lbClose();if(e.key==="ArrowLeft")show(cur-1);if(e.key==="ArrowRight")show(cur+1)});
  var sx=null;lb.addEventListener("touchstart",function(e){sx=e.touches[0].clientX},{passive:true});
  lb.addEventListener("touchend",function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)show(cur+(dx<0?1:-1));sx=null});
})();
