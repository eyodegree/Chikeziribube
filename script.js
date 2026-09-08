/*
 * Phase 3 — Google Apps Script integration
 *
 * IMPORTANT:
 * 1. Set GOOGLE_APPS_SCRIPT_URL after deploying the Apps Script.
 * 2. The Google Sheet itself is never exposed to this website.
 * 3. No RSVP records are stored in browser storage.
 */
const WEDDING_DATE = "2026-11-13T13:00:00+01:00";
const RSVP_DEADLINE = new Date("2026-10-11T23:59:59+01:00");
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybZcUyTw3zmj3gjsiLYbKMh01kmGnaOLJ9q0eRC30NWbnBhyDq1y6O5ahW6aMjChgn/exec"; // Website owner must paste the deployed Web App URL here.

const header=document.querySelector(".site-header");
window.addEventListener("scroll",()=>header.classList.toggle("scrolled",window.scrollY>30));

const menuToggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".site-nav");
menuToggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));});

const countdown={days:document.querySelector("#days"),hours:document.querySelector("#hours"),minutes:document.querySelector("#minutes"),seconds:document.querySelector("#seconds")};
function updateCountdown(){
 const distance=new Date(WEDDING_DATE).getTime()-Date.now();
 if(distance<=0){Object.values(countdown).forEach(el=>el.textContent="0");return;}
 countdown.days.textContent=Math.floor(distance/86400000);
 countdown.hours.textContent=Math.floor(distance/3600000)%24;
 countdown.minutes.textContent=Math.floor(distance/60000)%60;
 countdown.seconds.textContent=Math.floor(distance/1000)%60;
}
updateCountdown();setInterval(updateCountdown,1000);

document.querySelectorAll('input[name="rsvpType"]').forEach(r=>r.addEventListener("change",()=>{
 const couple=document.querySelector('input[name="rsvpType"]:checked')?.value==="couple";
 document.querySelector("#partner-field").classList.toggle("visible",couple);
 document.querySelector('input[name="partnerName"]').required=couple;
}));

function setStatus(message, type="info"){
 const el=document.querySelector("#form-status");
 el.textContent=message;
 el.dataset.state=type;
}

function getSelected(name){
 return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function validateClient(form){
 const data=new FormData(form);
 const guestName=String(data.get("guestName")||"").trim();
 const email=String(data.get("email")||"").trim();
 const attendance=getSelected("attendance");
 const rsvpType=getSelected("rsvpType");
 const partnerName=String(data.get("partnerName")||"").trim();
 const consent=data.get("consent")==="on";

 if(new Date()>RSVP_DEADLINE) return "The RSVP deadline has passed. We are no longer accepting RSVPs.";
 if(!guestName) return "Please enter your full name.";
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
 if(!attendance) return "Please select whether you will attend.";
 if(!rsvpType) return "Please select Individual or Couple.";
 if(rsvpType==="couple" && !partnerName) return "Please enter your partner's name.";
 if(!consent) return "Please confirm your consent before submitting.";
 return null;
}

document.querySelector("#rsvp-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const form=e.currentTarget;
 const button=form.querySelector('button[type="submit"]');
 const error=validateClient(form);
 if(error){setStatus(error,"error");return;}

 if(!GOOGLE_APPS_SCRIPT_URL){
   setStatus("The RSVP service has not been configured yet. No data was sent or stored.","error");
   return;
 }

 const data=new FormData(form);
 const payload={
   guestName:String(data.get("guestName")||"").trim(),
   partnerName:String(data.get("partnerName")||"").trim(),
   email:String(data.get("email")||"").trim(),
   phone:String(data.get("phone")||"").trim(),
   attendance:getSelected("attendance"),
   rsvpType:getSelected("rsvpType"),
   dietary:String(data.get("dietary")||"").trim(),
   notes:String(data.get("notes")||"").trim(),
   website:String(data.get("website")||"").trim()
 };

 button.disabled=true;
 button.textContent="Sending…";
 setStatus("Submitting your RSVP…","loading");

 try{
   const response=await fetch(GOOGLE_APPS_SCRIPT_URL,{
     method:"POST",
     headers:{"Content-Type":"text/plain;charset=utf-8"},
     body:JSON.stringify(payload)
   });
   const result=await response.json().catch(()=>({success:false,message:"Invalid response from RSVP service."}));
   if(!response.ok || !result.success) throw new Error(result.message||"We could not process your RSVP.");
   setStatus(result.message||"Your RSVP has been received.","success");
   form.reset();
   document.querySelector("#partner-field").classList.remove("visible");
   document.querySelector('input[name="partnerName"]').required=false;
 }catch(err){
   setStatus(err.message||"Something went wrong. Please try again.","error");
 }finally{
   button.disabled=false;
   button.textContent="Submit RSVP";
 }
});

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add("visible")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
