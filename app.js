/* ===================== VIERNES · app.js ===================== */
const K = { session:'viernes_session', data:'viernes_data', page:'viernes_page' };

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const money = n => '$' + Math.round(n).toLocaleString('es-CO');
const pesos = n => Math.round(n).toLocaleString('es-CO') + ' pesos colombianos';
const parseMoney = s => parseInt(String(s).replace(/[^\d]/g,'')) || 0;
function fmtMoney(el){ const n = parseMoney(el.value); el.value = n ? n.toLocaleString('es-CO') : ''; }
const now = () => new Date().toISOString();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
function fecha(iso){ const d=new Date(iso); return d.toLocaleDateString('es-CO',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}); }
function esc(s){ return String(s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }

function toast(msg, warn=false){
  const t=$('toast'); t.textContent=msg; t.className='toast show'+(warn?' warn':'');
  clearTimeout(t._t); t._t=setTimeout(()=>t.className='toast',2600);
}

/* ---------- categorías: paleta de colores ---------- */
const PALETA = ['#4fd6ff','#ffb64a','#35ffb0','#ff5069','#b7a5ff','#ff8fd6','#ffe066','#7cf5c4'];
const colorCat = i => PALETA[i % PALETA.length];
const DEFAULT_CATS = () => ([
  {nombre:'Necesidades', pct:50},
  {nombre:'Gustos', pct:30},
  {nombre:'Ahorro', pct:20}
]);

/* ---------- state ---------- */
function blankData(){
  return { totalReg:0, totalGast:0,
    config:{ categorias:[], listo:false },
    disp:{}, asign:{},
    ingresos:[], movimientos:[], historial:[] };
}
let D = blankData();

function migrarSiNecesario(){
  if(D.config && D.config.listo) return;                  // ya está en formato nuevo
  const nec = D.disp && D.disp.nec, gus = D.disp && D.disp.gus, aho = D.disp && D.disp.aho;
  const teniaDatosViejos = nec!==undefined || gus!==undefined || aho!==undefined ||
    (Array.isArray(D.gastos)&&D.gastos.length) || (Array.isArray(D.estupideces)&&D.estupideces.length) || (Array.isArray(D.ahorros)&&D.ahorros.length);
  if(!teniaDatosViejos) return;
  const cats = [
    {id:'nec', nombre:'Necesidades', pct:50},
    {id:'gus', nombre:'Gustos', pct:30},
    {id:'aho', nombre:'Ahorro', pct:20}
  ];
  D.config = { categorias:cats, listo:true };
  D.disp = { nec:nec||0, gus:gus||0, aho:aho||0 };
  D.asign = { nec:(D.asign&&D.asign.nec)||0, gus:(D.asign&&D.asign.gus)||0, aho:(D.asign&&D.asign.aho)||0 };
  D.movimientos = [];
  (D.gastos||[]).forEach(g=>D.movimientos.push({id:g.id,catId:'nec',catNombre:'Necesidades',catColor:colorCat(0),concepto:g.concepto,monto:g.monto,fecha:g.fecha}));
  (D.estupideces||[]).forEach(g=>D.movimientos.push({id:g.id,catId:'gus',catNombre:'Gustos',catColor:colorCat(1),concepto:g.concepto,monto:g.monto,fecha:g.fecha}));
  (D.ahorros||[]).forEach(g=>D.movimientos.push({id:g.id,catId:'aho',catNombre:'Ahorro',catColor:colorCat(2),concepto:g.concepto,monto:g.monto,fecha:g.fecha}));
  D.movimientos.sort((a,b)=> new Date(b.fecha)-new Date(a.fecha));
  delete D.gastos; delete D.estupideces; delete D.ahorros;
  save();
}

function load(){
  try{ D = JSON.parse(localStorage.getItem(K.data)) || blankData(); }catch(e){ D = blankData(); }
  if(!D.config) D.config = { categorias:[], listo:false };
  if(!Array.isArray(D.config.categorias)) D.config.categorias = [];
  if(!Array.isArray(D.movimientos)) D.movimientos = [];
  if(!D.disp) D.disp = {};
  if(!D.asign) D.asign = {};
  migrarSiNecesario();
}
function save(){ localStorage.setItem(K.data, JSON.stringify(D)); }
function getSession(){ try{ return JSON.parse(localStorage.getItem(K.session)); }catch(e){ return null; } }

/* ---------- boot ---------- */
const bootLines = [
  'A sus órdenes. Iniciando el núcleo Viernes…',
  'Reactor de arco: <span class="ok">ESTABLE</span>',
  'Disponiendo su protocolo de reparto personalizado…',
  'Custodiando la bóveda de ahorro… <span class="ok">SEGURA</span>',
  'Recuperando su historial, como lo dejó…',
  'Todo dispuesto. Quedo a su servicio. <span class="ok">LISTO</span>'
];
function runBoot(){
  const log = $('boot-log'); let i=0;
  (function next(){
    if(i<bootLines.length){
      log.innerHTML += '&gt; ' + bootLines[i] + '<br>'; i++;
      setTimeout(next, 380);
    } else {
      setTimeout(()=>{ $('boot').style.display='none'; routeStart(); }, 650);
    }
  })();
}
function routeStart(){
  const s = getSession();
  if(s && s.active){ enterApp(); }
  else { $('login').style.display='grid'; setTimeout(()=>$('login-user').focus(),100); }
}

/* ---------- VOZ (Web Speech API) ---------- */
let VOZ = { voice:null, activa:true };

function cargarVoces(){
  const voces = speechSynthesis.getVoices();
  if(!voces.length) return;

  // Nos quedamos primero solo con las voces en español (si hay alguna)
  const esVoces = voces.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
  const candidatas = esVoces.length ? esVoces : voces;

  // Nombres de voces FEMENINAS conocidas en distintos sistemas (Windows, macOS, Android, Chrome/Google)
  const femeninas = [
    'google español','microsoft sabina','microsoft helena','microsoft laura','microsoft elvira',
    'mónica','monica','paulina','angélica','angelica','lucía','lucia','conchita','penélope','penelope',
    'camila','valentina','esperanza','soledad','isabela','victoria','carmen','maría','maria','ximena'
  ];
  // Nombres de voces MASCULINAS conocidas, para descartarlas si hay otra opción
  const masculinas = [
    'microsoft pablo','jorge','diego','raúl','raul','carlos','miguel','enrique','jacinto','tarik','fernando','pablo'
  ];

  let elegida = candidatas.find(v => femeninas.some(f => v.name.toLowerCase().includes(f)));
  if(!elegida){
    // si ninguna coincide con nuestra lista de femeninas conocidas, al menos evitamos las masculinas conocidas
    elegida = candidatas.find(v => !masculinas.some(m => v.name.toLowerCase().includes(m)));
  }
  VOZ.voice = elegida || candidatas[0];
}
if('speechSynthesis' in window){
  cargarVoces();
  speechSynthesis.onvoiceschanged = cargarVoces;   // las voces cargan de forma asíncrona
}

function hablar(texto){
  if(!('speechSynthesis' in window) || !VOZ.activa) return;
  try{
    speechSynthesis.cancel();          // corta cualquier frase anterior
    const u = new SpeechSynthesisUtterance(texto);
    if(VOZ.voice) u.voice = VOZ.voice;
    u.lang   = VOZ.voice ? VOZ.voice.lang : 'es-ES';
    u.rate   = 0.98;   // velocidad (0.1–10) · baja un poco = tono "asistente"
    u.pitch  = 1.08;   // tono (0–2) · sube un pelín = voz más femenina/AI
    u.volume = 1.0;
    speechSynthesis.speak(u);
  }catch(e){ /* navegador sin soporte, se ignora */ }
}

/* ---------- session ---------- */
function iniciarSesion(){
  const user = ($('login-user').value || 'Jefe').trim();
  localStorage.setItem(K.session, JSON.stringify({active:true, user, startedAt:now()}));
  if(!localStorage.getItem(K.data)) { D = blankData(); save(); }
  $('login').style.display='none';
  enterApp(true);
}
function enterApp(greet){
  load();
  $('app').style.display='block';
  const s = getSession();
  $('brand-tag').textContent = s ? s.user + ' · en línea' : 'sistema en línea';
  const page = localStorage.getItem(K.page) || 'panel';
  switchPage(page);
  renderAll();
  startClock();
  if(greet){
    const s2=getSession(); const nombre = s2?s2.user:'señor';
    const saludo = 'Bienvenido, '+nombre+'. Sistema Viernes en línea. Quedo a su servicio.';
    setTimeout(()=>{ toast(saludo); hablar(saludo); }, 400);
  }
  if(!D.config.listo){
    setTimeout(()=>abrirConfig(true), greet?1700:500);
  }
}
function cerrarSesion(){ $('logout-modal').classList.add('show'); }
function confirmarCierre(){
  const s=getSession(); const nombre = s?s.user:'señor';   // ← se lee antes de borrar
  setTimeout(()=>{
    localStorage.removeItem(K.session);   // solo se cierra la sesión…
    // …los datos (K.data) y la página (K.page) se conservan intactos.
    $('logout-modal').classList.remove('show');
    $('app').style.display='none';
    $('login').style.display='grid';
    $('boot-log').innerHTML='';
    const despedida = 'Hasta luego, '+nombre+'. Su información queda a buen recaudo.';
    toast(despedida); hablar(despedida);
    setTimeout(()=>$('login-user').focus(),100);
  }, 700);
}
function cerrarModal(id){ $(id).classList.remove('show'); }

/* ---------- clock ---------- */
function startClock(){
  const upd=()=>{ const c=$('clock'); if(c) c.textContent=new Date().toLocaleTimeString('es-CO',{hour12:false}); };
  upd(); clearInterval(window._clk); window._clk=setInterval(upd,1000);
}

/* ---------- navigation ---------- */
function switchPage(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tabs > .tab').forEach(t=>t.classList.remove('active'));
  const pg=$('page-'+page); if(pg) pg.classList.add('active');
  const tb=document.querySelector('.tabs > .tab[data-page="'+page+'"]'); if(tb) tb.classList.add('active');
  localStorage.setItem(K.page, page);
}

/* ===================== CONFIGURAR DISTRIBUCIÓN ===================== */
function abrirConfig(inicial){
  $('config-title').textContent = inicial ? 'Configure su distribución' : 'Editar distribución';
  $('config-intro').textContent = inicial
    ? 'Antes de empezar, dígame en qué categorías repartir cada ingreso. Ponga el nombre y el porcentaje de cada una; deben sumar exactamente 100%.'
    : 'Puede renombrar, agregar, quitar o cambiar el porcentaje de sus categorías. La suma debe seguir dando exactamente 100%.';
  $('config-cancel').style.display = inicial ? 'none' : '';
  const rows = $('config-rows'); rows.innerHTML='';
  const base = (D.config.categorias && D.config.categorias.length)
    ? D.config.categorias.map(c=>({nombre:c.nombre, pct:c.pct}))
    : DEFAULT_CATS();
  base.forEach(c=>agregarFilaConfig(c.nombre, c.pct));
  actualizarTotalConfig();
  const modal = $('config-modal');
  modal.dataset.inicial = inicial ? '1' : '0';
  modal.classList.add('show');
}
function agregarFilaConfig(nombre='', pct=''){
  const rows = $('config-rows'); const i = rows.children.length;
  const div = document.createElement('div'); div.className='cat-row';
  div.innerHTML = `<span class="cat-dot" style="background:${colorCat(i)}"></span>
    <input type="text" class="cat-nombre" placeholder="Nombre (ej: Necesidades)" value="${esc(nombre)}">
    <input type="text" class="cat-pct" inputmode="numeric" placeholder="%" value="${pct}">
    <button class="cat-del" onclick="quitarFilaConfig(this)" title="Quitar categoría">✕</button>`;
  rows.appendChild(div);
  div.querySelectorAll('input').forEach(inp=>inp.addEventListener('input', actualizarTotalConfig));
  actualizarTotalConfig();
}
function quitarFilaConfig(btn){
  const rows = $('config-rows');
  if(rows.children.length<=1){ toast('Debe quedar al menos una categoría, señor.',true); return; }
  btn.closest('.cat-row').remove();
  actualizarTotalConfig();
}
function actualizarTotalConfig(){
  const filas = document.querySelectorAll('#config-rows .cat-row');
  let total=0;
  filas.forEach(f=>{ total += parseFloat(f.querySelector('.cat-pct').value)||0; });
  total = Math.round(total*10)/10;
  const el=$('config-total-val'); el.textContent = total+'%';
  el.style.color = total===100 ? 'var(--green)' : (total>100 ? 'var(--red)' : 'var(--gold)');
  const btn=$('config-save-btn'); if(btn) btn.disabled = (Math.round(total)!==100);
}
function guardarConfigClick(){
  const inicial = $('config-modal').dataset.inicial==='1';
  guardarConfig(inicial);
}
function guardarConfig(inicial){
  const filas = Array.from(document.querySelectorAll('#config-rows .cat-row'));
  const cats=[]; let total=0;
  for(const fila of filas){
    const nombre = fila.querySelector('.cat-nombre').value.trim();
    const pct = parseFloat(fila.querySelector('.cat-pct').value)||0;
    if(!nombre || pct<=0) continue;
    cats.push({nombre, pct}); total += pct;
  }
  if(cats.length===0){ toast('Defina al menos una categoría con nombre y porcentaje, señor.',true); return; }
  total = Math.round(total*10)/10;
  if(total!==100){ toast('El total debe sumar exactamente 100%, señor. Ahora mismo va en '+total+'%.',true); return; }

  const anteriores = D.config.categorias || [];
  const nuevas = cats.map(c=>{
    const prev = anteriores.find(p=>p.nombre.toLowerCase()===c.nombre.toLowerCase());
    return { id: prev?prev.id:uid(), nombre:c.nombre, pct:c.pct };
  });
  nuevas.forEach(c=>{ if(D.disp[c.id]===undefined) D.disp[c.id]=0; if(D.asign[c.id]===undefined) D.asign[c.id]=0; });

  D.config.categorias = nuevas;
  D.config.listo = true;
  save();
  cerrarModal('config-modal');
  renderAll();

  const resumen = nuevas.map(c=>c.nombre+' '+c.pct+' por ciento').join(', ');
  const frase = inicial
    ? 'Distribución configurada, señor: '+resumen+'. Todo el cien por ciento quedó repartido.'
    : 'Distribución actualizada, señor: '+resumen+'.';
  toast(inicial ? 'Configuración guardada, señor.' : 'Configuración actualizada, señor.');
  hablar(frase);
}

/* ---------- core: registrar ---------- */
function registrarDinero(){
  if(!D.config.listo || !D.config.categorias.length){
    toast('Primero configure su distribución, señor.',true); abrirConfig(true); return;
  }
  const m = parseMoney($('reg-monto').value);
  if(m<=0){ toast('Indíqueme un monto válido, señor.',true); return; }
  D.totalReg += m;
  D.config.categorias.forEach(c=>{
    const parte = m*c.pct/100;
    D.disp[c.id] = (D.disp[c.id]||0) + parte;
    D.asign[c.id] = (D.asign[c.id]||0) + parte;
  });
  const nota = ($('reg-nota').value||'').trim();
  const item = { id:uid(), monto:m, nota, fecha:now() };
  D.ingresos.unshift(item);
  D.historial.unshift({ id:item.id, tipo:'ingreso', detalle: nota||'Ingreso registrado', monto:m, fecha:item.fecha });
  save(); renderAll();
  $('reg-monto').value=''; $('reg-nota').value=''; updateSplitPreview();
  toast('Registrado y repartido según su configuración, señor.');
  const reparto = D.config.categorias.map(c=>c.nombre+' '+pesos(Math.round(m*c.pct/100))).join(', ');
  hablar('Registrados '+pesos(m)+', señor. '+reparto+'.');
}

/* ---------- core: movimiento (gasto por categoría) ---------- */
let filtroCat = 'todas';
function agregarMovimiento(){
  const catId = $('mv-categoria').value;
  const idx = D.config.categorias.findIndex(x=>x.id===catId);
  const cat = D.config.categorias[idx];
  if(!cat){ toast('Seleccione una categoría, señor.',true); return; }
  const c=($('mv-concepto').value||'').trim();
  const m=parseMoney($('mv-monto').value);
  if(!c){ toast('¿Bajo qué concepto lo anoto, señor?',true); return; }
  if(m<=0){ toast('El monto no es válido, señor.',true); return; }
  D.disp[cat.id] = (D.disp[cat.id]||0) - m; D.totalGast += m;
  const item={ id:uid(), catId:cat.id, catNombre:cat.nombre, catColor:colorCat(idx), concepto:c, monto:m, fecha:now() };
  D.movimientos.unshift(item);
  D.historial.unshift({ id:item.id, tipo:'gasto', detalle:cat.nombre+': '+c, monto:m, fecha:item.fecha });
  save(); renderAll();
  $('mv-concepto').value=''; $('mv-monto').value='';
  if(D.disp[cat.id]<0){
    toast('Con su permiso, señor: '+cat.nombre+' quedó en descubierto.',true);
    hablar('Con su permiso, señor. '+cat.nombre+' quedó en descubierto tras descontar '+pesos(m)+'.');
  } else {
    toast('Descontado de '+cat.nombre+', señor.');
    hablar('Descontados '+pesos(m)+' de '+cat.nombre+', señor. Le quedan '+pesos(D.disp[cat.id])+' disponibles ahí.');
  }
}
function filtrarMov(catId){ filtroCat=catId; renderCategoriasUI(); renderMovimientos(); }

/* ---------- delete ---------- */
function borrar(tipo, id){
  if(tipo==='gasto'){
    const it=D.movimientos.find(x=>x.id===id);
    if(it){ D.disp[it.catId]=(D.disp[it.catId]||0)+it.monto; D.totalGast-=it.monto; }
    D.movimientos=D.movimientos.filter(x=>x.id!==id);
  }
  D.historial=D.historial.filter(x=>x.id!==id);
  save(); renderAll(); toast('Movimiento revertido, señor.');
}

/* ---------- render ---------- */
function renderAll(){ renderHUD(); renderReactor(); renderCategoriasUI(); renderMovimientos(); renderHistorial(); updateSplitPreview(); }

function renderHUD(){
  $('hud-total').textContent=money(D.totalReg);
  $('hud-spent').textContent=money(D.totalGast);
  const cont=$('hud-cats'); cont.innerHTML='';
  D.config.categorias.forEach((c,i)=>{
    cont.innerHTML+=`<div class="hud-card" style="--catclr:${colorCat(i)}">
      <span class="hud-ico">◆</span>
      <div><b>${money(D.disp[c.id]||0)}</b><small>${esc(c.nombre)} · ${c.pct}%</small></div>
    </div>`;
  });
}

function renderReactor(){
  const cats = D.config.categorias;
  const svg = $('dist-reactor');
  const N = cats.length || 1;
  const step = N>1 ? Math.max(14, 64/N) : 0;
  let html=''; let total=0;
  cats.forEach((c,i)=>{
    const r = Math.max(20, 96 - i*step);
    const clr = colorCat(i);
    const C = 2*Math.PI*r;
    const asign=D.asign[c.id]||0, disp=D.disp[c.id]||0;
    const frac = asign>0 ? Math.max(0,Math.min(1, disp/asign)) : 0;
    html += `<circle cx="110" cy="110" r="${r}" class="track"/>`;
    html += `<circle cx="110" cy="110" r="${r}" class="seg" style="stroke:${clr};stroke-dasharray:${C};stroke-dashoffset:${C*(1-frac)};filter:drop-shadow(0 0 6px ${clr})"/>`;
    total += disp;
  });
  html += `<circle cx="110" cy="110" r="34" class="reactor-core-svg"/>`;
  svg.innerHTML = html;
  $('reactor-disp').textContent = money(total);
  const leg = $('legend'); leg.innerHTML='';
  cats.forEach((c,i)=>{
    leg.innerHTML+=`<div><i class="dot" style="background:${colorCat(i)};box-shadow:0 0 8px ${colorCat(i)}"></i>${esc(c.nombre)} <b>${money(D.disp[c.id]||0)}</b></div>`;
  });
}

function updateSplitPreview(){
  const m=parseMoney($('reg-monto').value);
  const cont=$('split-preview'); cont.innerHTML='';
  D.config.categorias.forEach((c,i)=>{
    cont.innerHTML+=`<div class="sp" style="--catclr:${colorCat(i)}"><small>${c.pct}% ${esc(c.nombre)}</small><b>${money(m*c.pct/100)}</b></div>`;
  });
}

function renderCategoriasUI(){
  // selector del formulario de movimientos
  const sel = $('mv-categoria');
  const prevVal = sel.value;
  sel.innerHTML = D.config.categorias.map(c=>`<option value="${c.id}">${esc(c.nombre)}</option>`).join('');
  if(D.config.categorias.some(c=>c.id===prevVal)) sel.value = prevVal;

  // saldos por categoría
  const bal = $('mv-balances'); bal.innerHTML='';
  D.config.categorias.forEach((c,i)=>{
    bal.innerHTML+=`<div class="pill-balance" style="border-color:${colorCat(i)}">${esc(c.nombre)} <b style="color:${colorCat(i)}">${money(D.disp[c.id]||0)}</b></div>`;
  });

  // chips de filtro
  const fl = $('mv-filtros'); fl.innerHTML='';
  fl.innerHTML += `<button class="chip ${filtroCat==='todas'?'active':''}" onclick="filtrarMov('todas')">Todas</button>`;
  D.config.categorias.forEach(c=>{
    fl.innerHTML += `<button class="chip ${filtroCat===c.id?'active':''}" onclick="filtrarMov('${c.id}')">${esc(c.nombre)}</button>`;
  });
}

function renderMovimientos(){
  const b=$('mv-body'); b.innerHTML='';
  const lista = filtroCat==='todas' ? D.movimientos : D.movimientos.filter(m=>m.catId===filtroCat);
  $('mv-empty').style.display = lista.length?'none':'block';
  lista.forEach((g,i)=>{
    b.innerHTML+=`<tr><td>${i+1}</td>
      <td><span class="badge" style="background:${g.catColor}22;color:${g.catColor};border:1px solid ${g.catColor}55">${esc(g.catNombre)}</span></td>
      <td>${esc(g.concepto)}</td>
      <td><span class="amt neg">-${money(g.monto)}</span></td>
      <td class="time">${fecha(g.fecha)}</td>
      <td><button class="del-btn" onclick="borrar('gasto','${g.id}')">✕</button></td></tr>`;
  });
}

function renderHistorial(){
  const b=$('hist-body'); b.innerHTML='';
  $('hist-empty').style.display = D.historial.length?'none':'block';
  D.historial.forEach((h,i)=>{
    const pos = h.tipo==='ingreso';
    b.innerHTML+=`<tr><td>${i+1}</td>
      <td><span class="badge ${h.tipo}">${h.tipo}</span></td>
      <td>${esc(h.detalle)}</td>
      <td><span class="amt ${pos?'pos':'neg'}">${pos?'+':'-'}${money(h.monto)}</span></td>
      <td class="time">${fecha(h.fecha)}</td></tr>`;
  });
}

/* ===================== PDF ===================== */
function descargarPDF(cierre){
  if(!window.jspdf){ toast('La librería PDF no está disponible, señor.',true); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const s = getSession() || {user:'Titular', startedAt:now()};
  const d = new Date();
  const fechaStr = d.toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'});
  const horaStr = d.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});

  // header band
  doc.setFillColor(3,8,20); doc.rect(0,0,210,46,'F');
  doc.setFillColor(28,123,255); doc.circle(24,23,9,'F');
  doc.setFillColor(140,236,255); doc.circle(24,23,4,'F');
  doc.setTextColor(140,236,255); doc.setFont('helvetica','bold'); doc.setFontSize(26);
  doc.text('VIERNES', 40, 21);
  doc.setTextColor(120,150,180); doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.text('Reporte de sesión financiera', 40, 28);
  doc.setTextColor(53,255,176); doc.setFontSize(9);
  doc.text('Titular: '+s.user+'   |   '+fechaStr+' · '+horaStr, 40, 35);
  doc.setDrawColor(28,123,255); doc.setLineWidth(0.6); doc.line(14,46,196,46);

  // resumen box (altura dinámica según cuántas categorías tenga configuradas)
  let y=58;
  doc.setTextColor(40,40,50); doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('Resumen de la sesión', 14, y); y+=8;
  const nFilas = D.config.categorias.length + 3; // total + cada categoría + gastado
  const boxH = nFilas*10 + 8;
  doc.setFillColor(244,248,252); doc.roundedRect(14,y-4,182,boxH,3,3,'F');
  const row=(label,val,color)=>{
    doc.setFont('helvetica','normal'); doc.setFontSize(10.5); doc.setTextColor(90,100,120);
    doc.text(label, 20, y+6);
    doc.setFont('helvetica','bold'); doc.setTextColor(color[0],color[1],color[2]);
    doc.text(val, 190, y+6, {align:'right'}); y+=10;
  };
  row('Total registrado', money(D.totalReg), [28,123,255]);
  D.config.categorias.forEach(c=>{
    row(c.nombre+' ('+c.pct+'%) disponible', money(D.disp[c.id]||0), [40,120,200]);
  });
  row('Total gastado', '-'+money(D.totalGast), [200,60,80]);
  const balance = D.config.categorias.reduce((sum,c)=>sum+(D.disp[c.id]||0),0);
  doc.setDrawColor(210,215,225); doc.line(20,y+1,190,y+1);
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(20,30,50);
  doc.text('Disponible total', 20, y+9);
  doc.setTextColor(28,123,255); doc.text(money(balance), 190, y+9, {align:'right'});
  y+=22;

  const head=[['#','Tipo','Detalle','Monto','Fecha']];
  const body=D.historial.map((h,i)=>[String(i+1),h.tipo.toUpperCase(),h.detalle,
    (h.tipo==='ingreso'?'+':'-')+money(h.monto), fecha(h.fecha)]);

  doc.setTextColor(40,40,50); doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('Historial de movimientos', 14, y); y+=4;
  doc.autoTable({
    startY:y, head, body, theme:'grid',
    headStyles:{fillColor:[28,123,255],textColor:[255,255,255],fontStyle:'bold',fontSize:9,halign:'left'},
    bodyStyles:{fontSize:8.5,textColor:[50,55,70],cellPadding:3.2},
    columnStyles:{0:{cellWidth:10,halign:'center'},1:{cellWidth:26},2:{cellWidth:78},3:{cellWidth:32,halign:'right',fontStyle:'bold'},4:{cellWidth:34,halign:'right',fontSize:7.5}},
    alternateRowStyles:{fillColor:[247,250,253]},
    didParseCell:function(data){
      if(data.section==='body' && data.column.index===3){
        const v=data.cell.raw||''; data.cell.styles.textColor = v.startsWith('+')?[30,150,100]:[200,60,80];
      }
    },
    margin:{left:14,right:14}
  });

  let fy=doc.lastAutoTable.finalY+10;
  if(fy>270){ doc.addPage(); fy=20; }
  doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(140,150,165);
  doc.text('Generado por Viernes · Sistema de asistencia financiera' + (cierre?' · Cierre de sesión':''), 105, fy, {align:'center'});

  const fn = 'VIERNES_'+(cierre?'Cierre_':'Historial_')+d.toISOString().slice(0,10)+'.pdf';
  doc.save(fn);
  if(!cierre) toast('PDF exportado, señor.');
}

/* ---------- keyboard ---------- */
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    if($('login').style.display!=='none' && document.activeElement.id==='login-user') iniciarSesion();
    if(document.activeElement.id==='reg-monto'||document.activeElement.id==='reg-nota') registrarDinero();
    if(document.activeElement.id==='mv-concepto'||document.activeElement.id==='mv-monto') agregarMovimiento();
  }
});
document.addEventListener('input',e=>{ if(e.target.id==='reg-monto') updateSplitPreview(); });

/* ---------- reiniciar sistema (fuerza traer la última versión guardada online) ---------- */
async function reiniciarSistema(){
  if(!navigator.onLine){
    toast('Necesita conexión a internet para reiniciar el sistema, señor.',true);
    hablar('Necesito conexión a internet para reiniciar el sistema, señor.');
    return;
  }
  toast('Reiniciando el núcleo, señor…');
  hablar('Reiniciando el núcleo del sistema, señor. Un momento.');
  try{
    if('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      for(const r of regs) await r.unregister();
    }
    if('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }catch(e){ /* si algo falla igual recargamos */ }
  setTimeout(()=>{ location.reload(); }, 900);
}

/* ---------- go ---------- */
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}
runBoot();
