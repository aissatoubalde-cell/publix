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
    m.textContent="Votre messagerie s'ouvre avec la demande prête à envoyer. Sinon, écrivez-nous à publix360bh@gmail.com ou au +224 628 22 31 74.";
    location.href="mailto:publix360bh@gmail.com?subject="+encodeURIComponent("Demande de projet – "+g("besoin"))+"&body="+encodeURIComponent(body);
  });

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
