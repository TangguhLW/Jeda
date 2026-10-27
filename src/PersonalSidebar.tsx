import {Bell,Bookmark,Calculator,History,Hourglass,MessageCircle,Plus,PanelLeftClose} from 'lucide-react';
import {SlidingSelection} from './SlidingSelection';
import type {Library,Page} from './library';
const pages=[{name:'Beranda',icon:MessageCircle},{name:'Tanggal tersimpan',icon:Bookmark},{name:'Pengingat',icon:Bell},{name:'Riwayat',icon:History}] as const;
export function PersonalSidebar({page,data,onNavigate,onNew,configured,collapsed,onCollapse,mobile=false}:{page:Page;data:Library;onNavigate:(page:Page)=>void;onNew:()=>void;configured:boolean;collapsed:boolean;onCollapse:()=>void;mobile?:boolean}) {
  return <aside className={`sidebar glass personal-sidebar ${collapsed&&!mobile?'collapsed':''}`}>
    <a className="brand" href="/" aria-label="Jeda, beranda" onClick={e=>{e.preventDefault();onNavigate('Beranda');}}><span className="brand-icon"><Hourglass size={22}/></span><span className="nav-copy">jeda.</span></a>
    <button className="new-question-button button" title="Pertanyaan baru" onClick={onNew}><Plus size={18}/><span className="nav-copy">Pertanyaan baru</span></button>
    <div className="sidebar-label nav-copy">RUANG PRIBADI</div>
    <nav aria-label="Navigasi utama"><SlidingSelection value={page} variant="navigation" label="Pilihan halaman">{pages.map(({name,icon:Icon})=><button className={`nav-item ${page===name?'selected':''}`} data-selection-active={page===name} aria-current={page===name?'page':undefined} title={name} key={name} onClick={()=>onNavigate(name)}><Icon size={18}/><span className="nav-copy">{name}</span>{name!=='Beranda'&&<span className="count nav-copy">{name==='Riwayat'?data.history.length:name==='Pengingat'?data.reminders.filter(v=>v.status==='pending').length:data.dates.length}</span>}</button>)}</SlidingSelection></nav>
    <div className="sidebar-bottom"><a href="/kalkulator" className="nav-item" title="Kalkulator lengkap"><Calculator size={18}/><span className="nav-copy">Kalkulator lengkap</span></a><div className="local-note nav-copy"><span className="local-dot"/>{configured?'Bahasa bebas aktif':'Hitungan lokal aktif'}<p>Tersimpan di browser ini. Tanpa akun.</p></div>{!mobile&&<button className="collapse-button" aria-label={collapsed?'Lebarkan sidebar':'Ringkas sidebar'} onClick={onCollapse}><PanelLeftClose size={17}/><span className="nav-copy">Ringkas sidebar</span></button>}</div>
  </aside>;
}
