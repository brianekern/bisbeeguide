import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Libre Baskerville', Georgia, serif";
const FONT_MONO = "'DM Mono', monospace";

const COLORS = {
  terracotta: "#C1673A", terracottaDark: "#9E4E28", terracottaLight: "#E8A07A",
  sand: "#F2E8D9", sandDark: "#DDD0BA", turquoise: "#2A8A8A",
  turquoiseDark: "#1D6363", turquoiseLight: "#5BB8B8",
  bark: "#4A3728", cream: "#FAF6F0", dusk: "#7A5C4A", sage: "#8A9E6A",
};

const NEIGHBORHOODS = [
  { name: "Old Bisbee", color: "#C1673A", desc: "...", maps: "https://www.google.com/maps/search/Old+Bisbee+AZ" },
  { name: "Brewery Gulch", color: "#2A8A8A", desc: "...", maps: "https://www.google.com/maps/search/Brewery+Gulch+Bisbee+AZ" },
  { name: "Lowell", color: "#8A9E6A", desc: "...", maps: "https://www.google.com/maps/search/Lowell+Bisbee+AZ" },
  { name: "Warren", color: "#7A5C4A", desc: "...", maps: "https://www.google.com/maps/search/Warren+Bisbee+AZ" },
  { name: "Tombstone Canyon", color: "#9E4E28", desc: "...", maps: "https://www.google.com/maps/search/Tombstone+Canyon+Bisbee+AZ" },
];

const DAYS = ["today","monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const CATEGORIES = ["Tour","Music","Market","Art","Nightlife","Wellness","Food","Community"];
const BULLETIN_CATEGORIES = ["Special","Event","Announcement","Popup"];

const YELP_LINKS = [
  { label: "Coffee", url: "https://www.google.com/maps/search/coffee+in+Bisbee+AZ" },
  { label: "Breakfast", url: "https://www.google.com/maps/search/breakfast+in+Bisbee+AZ" },
  { label: "Lunch", url: "https://www.google.com/maps/search/lunch+in+Bisbee+AZ" },
  { label: "Dinner", url: "https://www.google.com/maps/search/dinner+in+Bisbee+AZ" },
  { label: "Desserts & Sweets", url: "https://www.google.com/maps/search/desserts+sweets+bakery+in+Bisbee+AZ" },
  { label: "Bars", url: "https://www.google.com/maps/search/bars+in+Bisbee+AZ" },
  { label: "Shopping", url: "https://www.google.com/maps/search/shopping+in+Bisbee+AZ" },
  { label: "Art Galleries", url: "https://www.google.com/maps/search/art+galleries+in+Bisbee+AZ" },
  { label: "Hotels", url: "https://www.google.com/maps/search/hotels+in+Bisbee+AZ" },
];

const categoryColor = (cat) => {
  const map = {
    Tour: "#C1673A", Music: "#2A8A8A", Market: "#8A9E6A",
    Art: "#7A5C4A", Nightlife: "#4A3728", Wellness: "#1D6363",
    Food: "#9E4E28", Community: "#DDD0BA",
    Special: "#C1673A", Event: "#2A8A8A",
    Announcement: "#8A9E6A", Popup: "#7A5C4A",
  };
  return map[cat] || "#4A3728";
};

export default function BisbeeApp() {
  const [view, setView] = useState("visitor");
  const [visitorTab, setVisitorTab] = useState("today");
  const [adminTab, setAdminTab] = useState("bulletin");
  const [events, setEvents] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", category: "Business" });
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [newBulletin, setNewBulletin] = useState({ message: "", category: "Special" });
  const [newEvent, setNewEvent] = useState({ title: "", time: "", day: "today", category: "Community", location: "", description: "", url: "" });
  const [editBulletin, setEditBulletin] = useState(null);
  const [resetMode, setResetMode] = useState(false);
const [resetEmail, setResetEmail] = useState("");
const [resetSent, setResetSent] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => { fetchEvents(); fetchBulletins(); }, []);
  useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      setIsRecoverySession(true);
      setView("admin");
    }
  });
  return () => subscription.unsubscribe();
}, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (!error) setEvents(data || []);
    setLoading(false);
  };

  const fetchBulletins = async () => {
    const { data, error } = await supabase.from("bulletins").select("*").order("created_at", { ascending: false });
    if (!error) setBulletins(data || []);
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password });
    if (error) { setLoginError("Invalid credentials."); return; }
    const { data: biz } = await supabase.from("businesses").select("*").eq("id", data.user.id).single();
    setAdminUser({ id: data.user.id, name: biz?.name || "Business" });
    setLoginError("");
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setAdminUser(null); };

  const handleSignup = async () => {
    if (!signupForm.name.trim() || !signupForm.email.trim() || !signupForm.password.trim()) {
      setSignupError("Please fill in all fields.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email: signupForm.email, password: signupForm.password });
    if (error) { setSignupError(error.message); return; }
    await supabase.from("businesses").insert({ id: data.user.id, name: signupForm.name, email: signupForm.email, category: signupForm.category });
    setSignupSuccess(true);
    setSignupError("");
  };

  const postBulletin = async () => {
    if (!newBulletin.message.trim()) return;
    if (editBulletin) {
      await supabase.from("bulletins").update({ message: newBulletin.message, category: newBulletin.category }).eq("id", editBulletin);
      setEditBulletin(null);
    } else {
      await supabase.from("bulletins").insert({ business_id: adminUser.id, business_name: adminUser.name, category: newBulletin.category, message: newBulletin.message });
    }
    setNewBulletin({ message: "", category: "Special" });
    fetchBulletins();
  };

  const deleteBulletin = async (id) => { await supabase.from("bulletins").delete().eq("id", id); fetchBulletins(); };

  const postEvent = async () => {
    if (!newEvent.title.trim()) return;
    await supabase.from("events").insert({ ...newEvent, business_id: adminUser.id });
    setNewEvent({ title: "", time: "", day: "today", category: "Community", location: "", description: "", url: "" });
    fetchEvents();
  };

  const s = {
    app: { fontFamily: FONT_BODY, background: COLORS.cream, minHeight: "100vh", color: COLORS.bark },
    header: { background: COLORS.terracotta, position: "relative", overflow: "hidden" },
    headerPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 12px)`, zIndex: 1, pointerEvents: "none" },
    headerInner: { padding: "32px 24px 24px", position: "relative", zIndex: 2 },
    headerTitle: { fontFamily: FONT_DISPLAY, fontSize: "2.4rem", color: COLORS.sand, margin: 0, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 },
    headerSub: { fontFamily: FONT_MONO, fontSize: "0.7rem", color: COLORS.terracottaLight, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "6px" },
    navBar: { display: "flex", background: COLORS.terracottaDark, borderBottom: `3px solid ${COLORS.bark}` },
    navBtn: (a) => ({ fontFamily: FONT_MONO, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 20px", border: "none", background: a ? COLORS.bark : "transparent", color: a ? COLORS.sand : COLORS.terracottaLight, cursor: "pointer" }),
    tabBar: { display: "flex", overflowX: "auto", background: COLORS.sandDark, borderBottom: `2px solid ${COLORS.terracotta}`, padding: "0 12px" },
    tabBtn: (a) => ({ fontFamily: FONT_MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 14px", border: "none", background: "transparent", color: a ? COLORS.terracotta : COLORS.dusk, borderBottom: a ? `3px solid ${COLORS.terracotta}` : "3px solid transparent", cursor: "pointer", whiteSpace: "nowrap", fontWeight: a ? 700 : 400 }),
    section: { padding: "20px 16px", maxWidth: "720px", margin: "0 auto" },
    sectionTitle: { fontFamily: FONT_DISPLAY, fontSize: "1.5rem", color: COLORS.terracottaDark, marginBottom: "16px", fontWeight: 700, borderBottom: `1px solid ${COLORS.sandDark}`, paddingBottom: "8px" },
    card: { background: "#fff", borderRadius: "4px", padding: "16px", marginBottom: "12px", boxShadow: `2px 2px 0 ${COLORS.sandDark}`, border: `1px solid ${COLORS.sandDark}` },
    eventCard: { background: "#fff", borderRadius: "4px", marginBottom: "12px", boxShadow: `2px 2px 0 ${COLORS.sandDark}`, border: `1px solid ${COLORS.sandDark}`, overflow: "hidden", display: "flex" },
    eventStripe: (cat) => ({ width: "5px", background: categoryColor(cat), flexShrink: 0 }),
    eventBody: { padding: "14px 16px", flex: 1 },
    tag: (cat) => ({ display: "inline-block", fontFamily: FONT_MONO, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", background: categoryColor(cat), color: "#fff", padding: "2px 8px", borderRadius: "2px", marginBottom: "6px" }),
    eventTitle: { fontFamily: FONT_DISPLAY, fontSize: "1.05rem", fontWeight: 700, color: COLORS.bark, margin: "4px 0" },
    eventMeta: { fontFamily: FONT_MONO, fontSize: "0.68rem", color: COLORS.dusk, marginBottom: "6px" },
    eventDesc: { fontSize: "0.85rem", color: COLORS.dusk, lineHeight: 1.5 },
    bulletinCard: (cat) => ({ background: COLORS.sand, borderRadius: "4px", padding: "14px 16px", marginBottom: "10px", border: `1px solid ${COLORS.sandDark}`, borderLeft: `5px solid ${categoryColor(cat)}` }),
    bulletinBiz: { fontFamily: FONT_DISPLAY, fontSize: "1rem", fontWeight: 700, color: COLORS.terracottaDark },
    bulletinMsg: { fontSize: "0.88rem", color: COLORS.bark, marginTop: "4px", lineHeight: 1.5 },
    input: { width: "100%", padding: "10px 12px", borderRadius: "3px", border: `1px solid ${COLORS.sandDark}`, fontFamily: FONT_BODY, fontSize: "0.88rem", background: COLORS.cream, color: COLORS.bark, marginBottom: "10px", boxSizing: "border-box" },
    select: { padding: "10px 12px", borderRadius: "3px", border: `1px solid ${COLORS.sandDark}`, fontFamily: FONT_MONO, fontSize: "0.75rem", background: COLORS.cream, color: COLORS.bark, marginBottom: "10px", marginRight: "8px" },
    btn: (color = COLORS.terracotta) => ({ background: color, color: "#fff", border: "none", padding: "10px 20px", borderRadius: "3px", fontFamily: FONT_MONO, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", marginRight: "8px" }),
    btnOutline: { background: "transparent", color: COLORS.terracotta, border: `1px solid ${COLORS.terracotta}`, padding: "8px 14px", borderRadius: "3px", fontFamily: FONT_MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", marginRight: "6px" },
    loginBox: { maxWidth: "360px", margin: "60px auto", background: "#fff", borderRadius: "4px", padding: "32px", boxShadow: `4px 4px 0 ${COLORS.sandDark}`, border: `1px solid ${COLORS.sandDark}` },
    errorMsg: { color: COLORS.terracotta, fontFamily: FONT_MONO, fontSize: "0.72rem", marginBottom: "10px" },
    neighborhoodCard: (color) => ({ background: "#fff", borderRadius: "4px", padding: "14px 16px", marginBottom: "10px", borderLeft: `6px solid ${color}`, boxShadow: `2px 2px 0 ${COLORS.sandDark}` }),
    welcomeBox: { background: COLORS.turquoise, color: "#fff", borderRadius: "4px", padding: "20px", marginBottom: "20px" },
    emptyState: { color: COLORS.dusk, fontFamily: FONT_MONO, fontSize: "0.75rem", padding: "20px 0" },
    yelpBtn: { display: "inline-block", fontFamily: FONT_MONO, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 16px", borderRadius: "3px", background: COLORS.sand, border: `1px solid ${COLORS.sandDark}`, color: COLORS.bark, cursor: "pointer", marginRight: "8px", marginBottom: "8px", textDecoration: "none" },
  };

 const renderToday = () => (
  <div style={s.section}>
    <div style={s.sectionTitle}>Explore Bisbee</div>
    <div style={{ marginBottom: "24px" }}>
      {YELP_LINKS.map(link => (
        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={s.yelpBtn}>{link.label}</a>
      ))}
    </div>
    <div style={s.sectionTitle}>Today in Bisbee</div>
    {loading && <div style={s.emptyState}>Loading...</div>}
    {!loading && events.filter(e => e.day === "today").length === 0 && <div style={s.emptyState}>No events posted for today yet.</div>}
    {events.filter(e => e.day === "today").map(e => (
      <div key={e.id} style={s.eventCard}>
        <div style={s.eventStripe(e.category)} />
        <div style={s.eventBody}>
  <div style={s.tag(e.category)}>{e.category}</div>
  <div style={s.eventTitle}>{e.title}</div>
  <div style={s.eventMeta}>⏰ {e.time} &nbsp;·&nbsp; 📍 {e.location}</div>
  <div style={s.eventDesc}>{e.description}</div>
  {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.turquoise, textDecoration: "none", borderBottom: `1px solid ${COLORS.turquoiseLight}`, marginTop: "8px", display: "inline-block" }}>More Info →</a>}
</div>
      </div>
    ))}
  </div>
);
  const renderCalendar = () => (
    <div style={s.section}>
      <div style={s.sectionTitle}>This Week</div>
      {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(day => (
        <div key={day} style={{ marginBottom: "20px" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.turquoise, marginBottom: "8px", borderBottom: `1px dashed ${COLORS.sandDark}`, paddingBottom: "4px" }}>{day}</div>
          {events.filter(e => e.day === day).length === 0 && <div style={{ color: COLORS.sandDark, fontFamily: FONT_MONO, fontSize: "0.72rem" }}>— Nothing posted yet</div>}
          {events.filter(e => e.day === day).map(e => (
            <div key={e.id} style={s.eventCard}>
              <div style={s.eventStripe(e.category)} />
              <div style={s.eventBody}>
  <div style={s.tag(e.category)}>{e.category}</div>
  <div style={s.eventTitle}>{e.title}</div>
  <div style={s.eventMeta}>⏰ {e.time} &nbsp;·&nbsp; 📍 {e.location}</div>
  <div style={s.eventDesc}>{e.description}</div>
  {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.turquoise, textDecoration: "none", borderBottom: `1px solid ${COLORS.turquoiseLight}`, marginTop: "8px", display: "inline-block" }}>More Info →</a>}
</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderBulletins = () => (
    <div style={s.section}>
      <div style={s.sectionTitle}>Business Bulletins</div>
      {bulletins.length === 0 && <div style={s.emptyState}>No bulletins posted yet.</div>}
      {bulletins.map(b => (
        <div key={b.id} style={s.bulletinCard(b.category)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={s.bulletinBiz}>{b.business_name}</div>
            <div style={s.tag(b.category)}>{b.category}</div>
          </div>
          <div style={s.bulletinMsg}>{b.message}</div>
        </div>
      ))}
    </div>
  );

  const CLIMATE_DATA = [
  { month: "Jan", high: 57, low: 34, precip: 1.1 },
  { month: "Feb", high: 61, low: 37, precip: 0.9 },
  { month: "Mar", high: 66, low: 41, precip: 0.8 },
  { month: "Apr", high: 74, low: 47, precip: 0.4 },
  { month: "May", high: 82, low: 54, precip: 0.3 },
  { month: "Jun", high: 91, low: 62, precip: 0.6 },
  { month: "Jul", high: 88, low: 66, precip: 3.8 },
  { month: "Aug", high: 85, low: 64, precip: 3.9 },
  { month: "Sep", high: 82, low: 59, precip: 2.1 },
  { month: "Oct", high: 74, low: 50, precip: 1.2 },
  { month: "Nov", high: 63, low: 39, precip: 0.8 },
  { month: "Dec", high: 57, low: 34, precip: 1.0 },
];

const renderAbout = () => (
  <div style={s.section}>
    <div style={s.welcomeBox}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.6rem", fontWeight: 700, marginBottom: "10px" }}>Welcome to Bisbee, Arizona</div>
      <div style={{ fontSize: "0.9rem", lineHeight: 1.7, opacity: 0.95 }}>Tucked into the Mule Mountains of Cochise County at 5,300 feet, Bisbee is one of the most distinctive small towns in the American Southwest — a former copper mining boomtown turned arts enclave, perched above the Mexican border in the heart of the sky islands.</div>
    </div>
    {[
      { title: "Getting Here", body: "Bisbee is 90 miles southeast of Tucson via I-10 and Hwy 80. The nearest commercial airports are Tucson International (TUS) and Douglas Municipal. No public transit — a car is essential in this terrain." },
      { title: "Elevation & Climate", body: "At 5,300 ft, Bisbee stays significantly cooler than Tucson or Phoenix. Summers are mild with monsoon rains July–September. Winters can bring frost and occasional snow. Spring and fall are ideal." },
      { title: "The Sky Islands", body: "Bisbee sits within one of North America's most biodiverse regions. The sky islands support remarkable wildlife: hummingbirds, coatis, javelinas, black bears, and some of the darkest night skies in the continental US." },
    ].map(item => (
      <div key={item.title} style={s.card}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", fontWeight: 700, color: COLORS.terracottaDark, marginBottom: "8px" }}>{item.title}</div>
        <div style={{ fontSize: "0.85rem", color: COLORS.dusk, lineHeight: 1.6 }}>{item.body}</div>
        {item.title === "Elevation & Climate" && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.dusk, marginBottom: "12px" }}>Monthly Averages — Temp (°F) & Precipitation (in)</div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={CLIMATE_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontFamily: FONT_MONO, fontSize: 10, fill: COLORS.dusk }} />
                <YAxis yAxisId="temp" domain={[20, 100]} tick={{ fontFamily: FONT_MONO, fontSize: 10, fill: COLORS.dusk }} />
                <YAxis yAxisId="precip" orientation="right" domain={[0, 6]} tick={{ fontFamily: FONT_MONO, fontSize: 10, fill: COLORS.dusk }} />
                <Tooltip contentStyle={{ fontFamily: FONT_MONO, fontSize: "0.72rem", border: `1px solid ${COLORS.sandDark}`, borderRadius: "3px" }} />
                <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: "0.65rem" }} />
                <Bar yAxisId="precip" dataKey="precip" name="Precip (in)" fill={COLORS.turquoiseLight} opacity={0.7} radius={[2,2,0,0]} />
                <Line yAxisId="temp" type="monotone" dataKey="high" name="Avg High" stroke={COLORS.terracotta} strokeWidth={2} dot={false} />
                <Line yAxisId="temp" type="monotone" dataKey="low" name="Avg Low" stroke={COLORS.turquoise} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    ))}
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.3rem", fontWeight: 700, color: COLORS.terracottaDark, marginBottom: "12px", marginTop: "8px", borderBottom: `1px solid ${COLORS.sandDark}`, paddingBottom: "8px" }}>Day Trips & Nearby</div>
    {[
      { name: "Kartchner Caverns", desc: "A living cave system tucked beneath the Whetstone Mountains — one of the best-preserved caverns in the world. Reserve tours well in advance.", maps: "https://www.google.com/maps/search/Kartchner+Caverns+State+Park+AZ" },
      { name: "Chiricahua National Monument", desc: "An otherworldly forest of balanced rocks and volcanic spires rising from the Chiricahua Mountains. One of southeastern Arizona's most dramatic landscapes.", maps: "https://www.google.com/maps/search/Chiricahua+National+Monument+AZ" },
      { name: "Portal & Cave Creek Canyon", desc: "A birder's paradise on the edge of the Chiricahuas. Cave Creek Canyon is considered one of the top birding spots in North America — elegant trogons, sulphur-bellied flycatchers, and more.", maps: "https://www.google.com/maps/search/Portal+Arizona+Cave+Creek+Canyon" },
      { name: "Dragoon Mountains & Texas Canyon", desc: "The Dragoons were Cochise's stronghold — a labyrinth of granite boulders with deep Apache history. Texas Canyon along I-10 offers the same surreal geology from the highway.", maps: "https://www.google.com/maps/search/Texas+Canyon+Dragoon+Mountains+Arizona" },
      { name: "Sonoita Wine Country", desc: "Arizona's most established wine region sits at 5,000 feet on the high grasslands north of the border. A dozen tasting rooms within a short drive of each other.", maps: "https://www.google.com/maps/search/Sonoita+wine+country+Arizona" },
      { name: "Patagonia", desc: "A small art and birding town on the Santa Cruz River with a laid-back main street, excellent birding preserves, and a loyal community of artists and naturalists.", maps: "https://www.google.com/maps/search/Patagonia+Arizona" },
    ].map(place => (
      <div key={place.name} style={{ ...s.card, borderLeft: `4px solid ${COLORS.turquoise}`, marginBottom: "10px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1rem", fontWeight: 700, color: COLORS.bark, marginBottom: "4px" }}>{place.name}</div>
        <div style={{ fontSize: "0.82rem", color: COLORS.dusk, lineHeight: 1.6, marginBottom: "10px" }}>{place.desc}</div>
        <a href={place.maps} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.turquoise, textDecoration: "none", borderBottom: `1px solid ${COLORS.turquoiseLight}` }}>View on Map →</a>
      </div>
    ))}
  </div>
);

  const renderNeighborhoods = () => (
  <div style={s.section}>
    <div style={s.sectionTitle}>Neighborhoods</div>
    {NEIGHBORHOODS.map(n => (
      <div key={n.name} style={s.neighborhoodCard(n.color)}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", fontWeight: 700, color: COLORS.bark, marginBottom: "4px" }}>{n.name}</div>
        <div style={{ fontSize: "0.85rem", color: COLORS.dusk, lineHeight: 1.5, marginBottom: "10px" }}>{n.desc}</div>
        <a href={n.maps} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.turquoise, textDecoration: "none", borderBottom: `1px solid ${COLORS.turquoiseLight}` }}>View on Map →</a>
      </div>
    ))}
  </div>
);


  const renderAdmin = () => (
  <div style={s.section}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.3rem", fontWeight: 700, color: COLORS.terracottaDark }}>{adminUser.name}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", color: COLORS.dusk, letterSpacing: "0.08em" }}>BUSINESS DASHBOARD</div>
      </div>
      <button style={s.btnOutline} onClick={handleLogout}>Sign Out</button>
    </div>
    <div style={{ display: "flex", marginBottom: "20px", borderBottom: `2px solid ${COLORS.sandDark}` }}>
      {[["bulletin","Post Bulletin"],["event","Submit Event"],["manage","My Posts"]].map(([id,label]) => (
        <button key={id} style={s.tabBtn(adminTab === id)} onClick={() => setAdminTab(id)}>{label}</button>
      ))}
    </div>
    {adminTab === "bulletin" && (
      <div style={s.card}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", color: COLORS.terracottaDark, marginBottom: "12px", fontWeight: 700 }}>{editBulletin ? "Edit Bulletin" : "New Bulletin"}</div>
        <select style={s.select} value={newBulletin.category} onChange={e => setNewBulletin({ ...newBulletin, category: e.target.value })}>
          {BULLETIN_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <textarea style={{ ...s.input, height: "90px", resize: "vertical" }} placeholder="Today's special, popup event, or announcement..." value={newBulletin.message} onChange={e => setNewBulletin({ ...newBulletin, message: e.target.value })} />
        <button style={s.btn()} onClick={postBulletin}>{editBulletin ? "Update" : "Post Bulletin"}</button>
        {editBulletin && <button style={s.btn(COLORS.dusk)} onClick={() => { setEditBulletin(null); setNewBulletin({ message: "", category: "Special" }); }}>Cancel</button>}
      </div>
    )}
    {adminTab === "event" && (
      <div style={s.card}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", color: COLORS.terracottaDark, marginBottom: "12px", fontWeight: 700 }}>Submit an Event</div>
        <input style={s.input} placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
        <div style={{ display: "flex", gap: "8px" }}>
          <input style={{ ...s.input, flex: 1 }} placeholder="Time (e.g. 7:00 PM)" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
          <select style={{ ...s.select, flex: 1 }} value={newEvent.day} onChange={e => setNewEvent({ ...newEvent, day: e.target.value })}>
            {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
        <input style={s.input} placeholder="Location / Venue" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
        <select style={s.select} value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <textarea style={{ ...s.input, height: "70px", resize: "vertical" }} placeholder="Brief description..." value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
<input style={s.input} placeholder="More info URL (optional)" value={newEvent.url} onChange={e => setNewEvent({ ...newEvent, url: e.target.value })} />
<button style={s.btn(COLORS.turquoise)} onClick={postEvent}>Submit Event</button>
      </div>
    )}
    {adminTab === "manage" && (
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", color: COLORS.terracottaDark, marginBottom: "12px", fontWeight: 700 }}>Your Active Bulletins</div>
        {bulletins.filter(b => b.business_id === adminUser.id).length === 0 && <div style={s.emptyState}>No bulletins posted yet.</div>}
        {bulletins.filter(b => b.business_id === adminUser.id).map(b => (
          <div key={b.id} style={s.bulletinCard(b.category)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={s.tag(b.category)}>{b.category}</div>
              <div>
                <button style={s.btnOutline} onClick={() => { setEditBulletin(b.id); setNewBulletin({ message: b.message, category: b.category }); setAdminTab("bulletin"); }}>Edit</button>
                <button style={{ ...s.btnOutline, color: COLORS.terracotta, borderColor: COLORS.terracotta }} onClick={() => deleteBulletin(b.id)}>Delete</button>
              </div>
            </div>
            <div style={s.bulletinMsg}>{b.message}</div>
          </div>
        ))}
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", color: COLORS.terracottaDark, margin: "24px 0 12px", fontWeight: 700 }}>Your Active Events</div>
        {events.filter(e => e.business_id === adminUser.id).length === 0 && <div style={s.emptyState}>No events posted yet.</div>}
        {events.filter(e => e.business_id === adminUser.id).map(e => (
          <div key={e.id} style={s.eventCard}>
            <div style={s.eventStripe(e.category)} />
            <div style={s.eventBody}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={s.tag(e.category)}>{e.category}</div>
                <button style={{ ...s.btnOutline, color: COLORS.terracotta, borderColor: COLORS.terracotta }} onClick={async () => {
                  await supabase.from("events").delete().eq("id", e.id);
                  fetchEvents();
                }}>Delete</button>
              </div>
              <div style={s.eventTitle}>{e.title}</div>
              <div style={s.eventMeta}>⏰ {e.time} &nbsp;·&nbsp; 📍 {e.location} &nbsp;·&nbsp; {e.day}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);


const renderLogin = () => {
  if (isRecoverySession) return (
    <div style={s.loginBox}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.4rem", fontWeight: 700, color: COLORS.terracottaDark, marginBottom: "20px" }}>Set New Password</div>
      {passwordUpdateSuccess ? (
        <div style={{ fontFamily: FONT_MONO, fontSize: "0.8rem", color: COLORS.turquoise, lineHeight: 1.6 }}>
          Password updated! <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setIsRecoverySession(false); setPasswordUpdateSuccess(false); }}>Sign in</span>
        </div>
      ) : (
        <>
          <input style={s.input} placeholder="New password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <button style={s.btn()} onClick={async () => {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (!error) setPasswordUpdateSuccess(true);
          }}>Update Password</button>
        </>
      )}
    </div>
  );

  if (resetMode) return (
    <div style={s.loginBox}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.4rem", fontWeight: 700, color: COLORS.terracottaDark, marginBottom: "20px" }}>Reset Password</div>
      {resetSent ? (
        <div style={{ fontFamily: FONT_MONO, fontSize: "0.8rem", color: COLORS.turquoise, lineHeight: 1.6 }}>
          Check your email for a reset link. <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setResetMode(false); setResetSent(false); }}>Back to sign in</span>
        </div>
      ) : (
        <>
          <input style={s.input} placeholder="Email" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
          <button style={s.btn()} onClick={async () => {
            await supabase.auth.resetPasswordForEmail(resetEmail, {
              redirectTo: "https://bisbeeguide.vercel.app"
            });
            setResetSent(true);
          }}>Send Reset Link</button>
          <div style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", color: COLORS.dusk, marginTop: "12px", cursor: "pointer", textDecoration: "underline" }} onClick={() => setResetMode(false)}>Back to sign in</div>
        </>
      )}
    </div>
  );

  return (
    <div style={s.loginBox}>
      {showSignup ? (
        <>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.4rem", fontWeight: 700, color: COLORS.terracottaDark, marginBottom: "4px" }}>Create Account</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: "0.68rem", color: COLORS.dusk, marginBottom: "20px", letterSpacing: "0.08em" }}>BUSINESS · ARTIST · VENDOR</div>
          {signupSuccess ? (
            <div style={{ fontFamily: FONT_MONO, fontSize: "0.8rem", color: COLORS.turquoise, lineHeight: 1.6 }}>
              Account created! Check your email to confirm, then <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setShowSignup(false); setSignupSuccess(false); }}>sign in here</span>.
            </div>
          ) : (
            <>
              {signupError && <div style={s.errorMsg}>{signupError}</div>}
              <input style={s.input} placeholder="Business or Artist Name" value={signupForm.name} onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} />
              <input style={s.input} placeholder="Email" type="email" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} />
              <input style={s.input} placeholder="Password" type="password" value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} />
              <select style={{ ...s.select, width: "100%", marginRight: 0 }} value={signupForm.category} onChange={e => setSignupForm({ ...signupForm, category: e.target.value })}>
                <option>Business</option>
                <option>Artist</option>
                <option>Musician</option>
                <option>Vendor</option>
              </select>
              <button style={s.btn()} onClick={handleSignup}>Create Account</button>
              <div style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", color: COLORS.dusk, marginTop: "12px", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowSignup(false)}>Already have an account? Sign in</div>
            </>
          )}
        </>
      ) : (
        <>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.4rem", fontWeight: 700, color: COLORS.terracottaDark, marginBottom: "4px" }}>Business Portal</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: "0.68rem", color: COLORS.dusk, marginBottom: "20px", letterSpacing: "0.08em" }}>POST BULLETINS · SUBMIT EVENTS</div>
          {loginError && <div style={s.errorMsg}>{loginError}</div>}
          <input style={s.input} placeholder="Email" type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
          <input style={s.input} placeholder="Password" type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <button style={s.btn()} onClick={handleLogin}>Sign In</button>
          <div style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", color: COLORS.dusk, marginTop: "12px", cursor: "pointer", textDecoration: "underline" }} onClick={() => setResetMode(true)}>Forgot password?</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: "0.65rem", color: COLORS.dusk, marginTop: "8px", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowSignup(true)}>New to Bisbee Guide? Create an account</div>
        </>
      )}
    </div>
  );
};

  {adminTab === "manage" && (
  <div>
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", color: COLORS.terracottaDark, marginBottom: "12px", fontWeight: 700 }}>Your Active Bulletins</div>
    {bulletins.filter(b => b.business_id === adminUser.id).length === 0 && <div style={s.emptyState}>No bulletins posted yet.</div>}
    {bulletins.filter(b => b.business_id === adminUser.id).map(b => (
      <div key={b.id} style={s.bulletinCard(b.category)}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={s.tag(b.category)}>{b.category}</div>
          <div>
            <button style={s.btnOutline} onClick={() => { setEditBulletin(b.id); setNewBulletin({ message: b.message, category: b.category }); setAdminTab("bulletin"); }}>Edit</button>
            <button style={{ ...s.btnOutline, color: COLORS.terracotta, borderColor: COLORS.terracotta }} onClick={() => deleteBulletin(b.id)}>Delete</button>
          </div>
        </div>
        <div style={s.bulletinMsg}>{b.message}</div>
      </div>
    ))}

    <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1.1rem", color: COLORS.terracottaDark, margin: "24px 0 12px", fontWeight: 700 }}>Your Active Events</div>
    {events.filter(e => e.business_id === adminUser.id).length === 0 && <div style={s.emptyState}>No events posted yet.</div>}
    {events.filter(e => e.business_id === adminUser.id).map(e => (
      <div key={e.id} style={s.eventCard}>
        <div style={s.eventStripe(e.category)} />
        <div style={s.eventBody}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={s.tag(e.category)}>{e.category}</div>
            <button style={{ ...s.btnOutline, color: COLORS.terracotta, borderColor: COLORS.terracotta }} onClick={async () => {
              await supabase.from("events").delete().eq("id", e.id);
              fetchEvents();
            }}>Delete</button>
          </div>
          <div style={s.eventTitle}>{e.title}</div>
          <div style={s.eventMeta}>⏰ {e.time} &nbsp;·&nbsp; 📍 {e.location} &nbsp;·&nbsp; {e.day}</div>
        </div>
      </div>
    ))}
  </div>
)}

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={s.header}>
        <div style={s.headerPattern} />
        <div style={s.headerInner}>
          <div style={s.headerTitle}>Bisbee, Arizona</div>
          <div style={s.headerSub}>Sky Islands · Copper Country · 5,300 ft</div>
        </div>
        <div style={s.navBar}>
          <button style={s.navBtn(view === "visitor")} onClick={() => setView("visitor")}>🗺 Visitor Guide</button>
          <button style={s.navBtn(view === "admin")} onClick={() => setView("admin")}>🏪 Business Portal</button>
        </div>
      </div>
      {view === "visitor" && (
        <div>
          <div style={s.tabBar}>
            {[["today","Today"],["calendar","This Week"],["bulletins","Bulletins"],["about","About"],["map","Neighborhoods"]].map(([id,label]) => (
              <button key={id} style={s.tabBtn(visitorTab === id)} onClick={() => setVisitorTab(id)}>{label}</button>
            ))}
          </div>
          {visitorTab === "today" && renderToday()}
          {visitorTab === "calendar" && renderCalendar()}
          {visitorTab === "bulletins" && renderBulletins()}
          {visitorTab === "about" && renderAbout()}
          {visitorTab === "map" && renderNeighborhoods()}
        </div>
      )}
      {view === "admin" && (adminUser ? renderAdmin() : renderLogin())}
    </div>
  );
}