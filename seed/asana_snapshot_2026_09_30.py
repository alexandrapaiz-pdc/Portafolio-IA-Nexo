"""Asana 'Backlog Personal' snapshot (Sep 30, 2026) and project ↔ Asana parent-task mapping.
The live page re-syncs these documents through the viewer's Asana connector."""
import json, re, pathlib
out = pathlib.Path(__file__).parent
NOW = "2026-09-30T19:00:00Z"
PARENT = {  # page project -> (Asana parent task gid, include regex, exclude regex)
 "infra": ("1218995598415931", None, "Mundos|Tier 1|Benji|agent deployment"),
 "mundos": ("1218995598415931", "Mundos", None),
 "protocolos": ("1218995598415931", "Tier 1|Benji|agent deployment", None),
 "avon": ("1218995607441607", None, None),
 "contraloria": ("1218995612338724", None, None),
 "gh": ("1218994990199396", None, None),
 "lexy": ("1218995352829981", None, None),
 "step": ("1218995343549245", None, None),
}
SUB = {
 "1218995598415931": [
  ("1219040036954736","Brainstorm scalable agent deployment model (sandbox, agents portal, deployment guide) + review Citizen project with JP","2026-10-09"),
  ("1219040095189778","Decide orchestration with Edgar: keep N8N vs. move to code (Temporal/LangGraph) for Portales de Mundos","2026-10-06"),
  ("1219039912830375","Portales de Mundos: get frontend repo + N8N flow JSON export from Jorge, re-import in own instance","2026-10-02"),
  ("1219040095058664","Polish AI stack presentation: add cybersecurity, governance, controls + EXO standards (PII Anonymizer)","2026-10-05"),
  ("1219039716113071","Publish Tier 1 & Tier 2 protocols in personal GitHub (migrate to enterprise when ready)","2026-10-09"),
  ("1219039912652625","Meet Benji: define cybersecurity protocols for Tier 1 & Tier 2 (API keys, secrets, .env, recommended settings)","2026-10-02"),
  ("1219039977800397","Request Temporal Cloud (pay-as-you-go) and reactivate enterprise GitHub account","2026-10-06"),
  ("1219039715991026","Get Azure admin account with IT (unblocks Databricks, Entra ID, Key Vault, agent marketplace)","2026-10-02"),
  ("1218995603726392","Claude licenses: send final request to Luis Carlos Hurtado (Luisca)","2026-10-02"),
  ("1218995983967110","Claude licenses: decide scope (categories, subcategories, or both)","2026-10-01"),
  ("1218994981177242","Claude licenses: compile list of everyone requesting (Jenny/Lisa list + Personal Care)","2026-10-01"),
  ("1218994981079083","Consolidate the ~10 AI projects into one view for Óscar's go-ahead","2026-10-08"),
  ("1218995983602381","Build agents portal template (Ecosol-style project cards)","2026-10-07"),
  ("1218994980868681","Design controls & permissions model (agent registry, policy engine, escalation, audit logs)","2026-10-09"),
  ("1218995983263366","Set Databricks rollout owner and timeline + n8n interim fallback plan","2026-10-06"),
  ("1218995333698876","Open idea-to-launch ticket(s) for Vikingo support (JDE connector, data warehouse access, agents portal domain)","2026-10-02"),
  ("1218995333544648","Define Nexo AI stack components (Azure, Databricks, Temporal, LangGraph, model router)","2026-10-02")],
 "1218995607441607": [
  ("1218995357043402","Recommended: build SOP library from recorded sessions (Scribe / Zoom recordings)","2026-10-19"),
  ("1218995613909636","Recommended: design phase 2 automation — estimation (UPR × projected orders) and pricing-flow checks","2026-10-19"),
  ("1218995356891617","Open idea-to-launch ticket with Vikingo Tech for kickoff → KPI automation (incl. direct pull from Vikingo Planeación)","2026-10-12"),
  ("1218995607999519","Review Meli's Avon Portal","2026-10-08"),
  ("1218995988493896","Design separate handling for Children category in Avon data","2026-10-09"),
  ("1218994985682054","Draft To-Be re-engineering design (Vikingo Planeación as source, centralized cost/split/commission files)","2026-10-09"),
  ("1218995342579591","Scope automation of Avon data extraction: Excel base → KPI tables (7-week sprint)","2026-10-08"),
  ("1218995988213565","Get historical campaign base + how the sales DB was built (Carlos Escamilla, Diego Ortega's team)","2026-10-06"),
  ("1218994985513617","Name and map the 15-step Avon planning process (incl. the 3 process branches)","2026-10-07"),
  ("1218994985474815","Confirm Vikingo Planeación as To-Be data source (with Allan Trujillo & Cristian)","2026-10-05"),
  ("1218995344286173","Request the C7 kickoff presentation + access to category working folders (Lisa)","2026-09-30"),
  ("1218995342312198","Consolidate critical feedback on the new tool before it goes official","2026-09-30")],
 "1218995612338724": [
  ("1219040037391913","Q4 solution-definition sessions with Ada (AP/expenses) and José (inventory purchases)","2026-10-06"),
  ("1218995356246373","Write Contraloría project card (need, KPIs, baseline and target, as-is / to-be, hypotheses)","2026-10-09"),
  ("1218994991081377","Recommended quick win: propose a single document intake channel for Tráfico (before the agent)","2026-10-08"),
  ("1218995612934468","Get access to the pending-settlements AI view and the shared Tráfico → Contraloría folder","2026-10-02"),
  ("1218995605611160","Prepare 30-min Claude mini-course for the MegaMás team (what it is, prompting, traceability when editing files)","2026-10-09"),
  ("1218995605254789","Map accounts payable / expenses process (credit cards, advances, utilities)","2026-10-19"),
  ("1218995985579840","Spec the document-matching + ERP registration agent (incl. retentions rules)","2026-10-09"),
  ("1218994982766077","Build baseline: non-deductible VAT, overdue payments, documents missing per month","2026-10-07"),
  ("1218995605070962","Map inventory-purchase document flow (Tráfico → Contraloría → ERP) and define agent scope","2026-10-06")],
 "1218994990199396": [
  ("1218995993912966","Define portal access for staff without corporate email (personal-email login + permissions)","2026-10-12"),
  ("1218995356420687","Analyze vacation data: critical cases (>2 periods) by country and money at risk","2026-10-07"),
  ("1218995356344910","Collect inputs: SharePoint folder, vacation Excel and process videos (Luis Fernando) + Forms video/deck (Edgar)","2026-10-01"),
  ("1218995605458725","Design alert agent + leader and CAM report formats","2026-10-19"),
  ("1218994983124484","Write project card (cost-avoidance case, baseline, 3 Q4 hypotheses)","2026-10-08")],
 "1218995352829981": [
  ("1219009968671416","Recommended: scope Avon Item Data validation agent (folleto vs. IDF)","2026-10-19"),
  ("1218994991514055","Inventory support content: SharePoint docs + OTRS ticket export by category","2026-10-09"),
  ("1218995338452974","Scope IT support knowledge base","2026-10-12")],
 "1218995343549245": [
  ("1218995345424270","Review Rodny's documentation + PoC and draft the staged validation flow per area","2026-10-09")],
}
for pid, (gid, inc, exc) in PARENT.items():
    tasks = [dict(gid=g, name=n, done=False, due=d, completedAt=None) for g, n, d in SUB[gid]
             if (not inc or re.search(inc, n, re.I)) and (not exc or not re.search(exc, n, re.I))]
    json.dump({"syncedAt": NOW, "parentGid": gid, "tasks": tasks}, open(out / "asana" / f"{pid}.json", "w"), ensure_ascii=False, indent=1)
    m = {"gid": gid}
    if inc: m["include"] = inc
    if exc: m["exclude"] = exc
    json.dump({"asana": m}, open(out / "asana" / f"_map_{pid}.json", "w"), ensure_ascii=False)
    print(pid, len(tasks))
json.dump({"syncedAt": NOW}, open(out / "asana" / "_meta.json", "w"))
