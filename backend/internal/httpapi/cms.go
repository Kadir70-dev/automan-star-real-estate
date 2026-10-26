package httpapi

import (
 "context"
 "encoding/json"
 "net/http"
 "strings"
 "time"

 "github.com/jackc/pgx/v5"
)

type cmsPage struct {
 Key string `json:"key"`
 Path string `json:"path"`
 Title string `json:"title"`
 Draft json.RawMessage `json:"draft"`
 Published json.RawMessage `json:"published"`
 DraftRevision int `json:"draft_revision"`
 PublishedRevision *int `json:"published_revision"`
}

func (a API) cmsPublicPage(w http.ResponseWriter,r *http.Request) {
 if a.DB==nil {respond(w,503,map[string]string{"error":"database unavailable"});return}
 key:=r.PathValue("key")
 if !validCMSKey(key) {respond(w,404,map[string]string{"error":"not found"});return}
 ctx,cancel:=context.WithTimeout(r.Context(),3*time.Second);defer cancel()
 var content json.RawMessage
 err:=a.DB.QueryRow(ctx,"SELECT published FROM cms_pages WHERE page_key=$1 AND published IS NOT NULL",key).Scan(&content)
 if err!=nil {respond(w,404,map[string]string{"error":"not found"});return}
 w.Header().Set("Cache-Control","public, max-age=30")
 w.Header().Set("Content-Type","application/json; charset=utf-8")
 _=json.NewEncoder(w).Encode(map[string]any{"key":key,"content":content})
}
func validCMSKey(key string) bool {
 if len(key)<1||len(key)>80 {return false}
 for i,c:=range key { if (c>='a'&&c<='z')||(c>='0'&&c<='9')||(i>0&&(c=='-'||c=='_')) {continue};return false }
 return true
}
func (a API) cmsList(w http.ResponseWriter,r *http.Request) {
 ctx,cancel:=context.WithTimeout(r.Context(),5*time.Second);defer cancel()
 rows,err:=a.DB.Query(ctx,"SELECT page_key,path,title,draft_revision,published_revision,updated_at FROM cms_pages ORDER BY path")
 if err!=nil {respond(w,503,map[string]string{"error":"cms unavailable"});return};defer rows.Close()
 items:=make([]map[string]any,0)
 for rows.Next(){
 var key,path,title string;var draft int;var published *int;var updated time.Time
 if err=rows.Scan(&key,&path,&title,&draft,&published,&updated);err!=nil {respond(w,500,map[string]string{"error":"cms read failure"});return}
 items=append(items,map[string]any{"key":key,"path":path,"title":title,"draft_revision":draft,"published_revision":published,"updated_at":updated})
 }
 if rows.Err()!=nil {respond(w,500,map[string]string{"error":"cms read failure"});return}
 respond(w,200,map[string]any{"data":items})
}
func (a API) cmsRead(w http.ResponseWriter,r *http.Request){
 key:=r.PathValue("key");if !validCMSKey(key){respond(w,404,map[string]string{"error":"not found"});return}
 ctx,cancel:=context.WithTimeout(r.Context(),3*time.Second);defer cancel()
 var p cmsPage
 err:=a.DB.QueryRow(ctx,"SELECT page_key,path,title,draft,published,draft_revision,published_revision FROM cms_pages WHERE page_key=$1",key).Scan(&p.Key,&p.Path,&p.Title,&p.Draft,&p.Published,&p.DraftRevision,&p.PublishedRevision)
 if err!=nil {respond(w,404,map[string]string{"error":"not found"});return}
 respond(w,200,p)
}
func cmsPayload(w http.ResponseWriter,r *http.Request)(json.RawMessage,bool){
 r.Body=http.MaxBytesReader(w,r.Body,256<<10)
 var raw json.RawMessage
 decoder:=json.NewDecoder(r.Body);if decoder.Decode(&raw)!=nil||len(raw)==0||raw[0]!='{'{respond(w,400,map[string]string{"error":"expected JSON object"});return nil,false}
 var value map[string]any
 if json.Unmarshal(raw,&value)!=nil {respond(w,400,map[string]string{"error":"invalid JSON"});return nil,false}
 // Prevent accidental script execution by never accepting raw HTML fields.
 for k:=range value { if strings.EqualFold(k,"html")||strings.EqualFold(k,"script")||strings.EqualFold(k,"css") {respond(w,400,map[string]string{"error":"raw code fields not permitted"});return nil,false} }
 return raw,true
}
func (a API) cmsDraft(w http.ResponseWriter,r *http.Request){
 key:=r.PathValue("key");if !validCMSKey(key){respond(w,400,map[string]string{"error":"invalid page key"});return}
 var payload struct{Path string `json:"path"`;Title string `json:"title"`;Content json.RawMessage `json:"content"`;ExpectedRevision int `json:"expected_revision"`}
 r.Body=http.MaxBytesReader(w,r.Body,256<<10)
 if json.NewDecoder(r.Body).Decode(&payload)!=nil||payload.ExpectedRevision<0||len(payload.Content)==0||payload.Content[0]!='{'||len(payload.Title)>200||len(payload.Path)>240||!strings.HasPrefix(payload.Path,"/")||strings.HasPrefix(payload.Path,"//"){respond(w,400,map[string]string{"error":"invalid page draft"});return}
 var valid map[string]any
 if json.Unmarshal(payload.Content,&valid)!=nil{respond(w,400,map[string]string{"error":"invalid content object"});return}
 ctx,cancel:=context.WithTimeout(r.Context(),5*time.Second);defer cancel()
 session,_:=a.session(r)
 var revision int
 // Optimistic revisions avoid overwriting a colleague's later edits.
 err:=a.DB.QueryRow(ctx,`INSERT INTO cms_pages(page_key,path,title,draft,updated_by) VALUES($1,$2,$3,$4,$5)
 ON CONFLICT(page_key) DO UPDATE SET path=excluded.path,title=excluded.title,draft=excluded.draft,draft_revision=cms_pages.draft_revision+1,updated_by=excluded.updated_by,updated_at=now()
 WHERE cms_pages.draft_revision=$6 RETURNING draft_revision`,key,payload.Path,payload.Title,payload.Content,session.ID,payload.ExpectedRevision).Scan(&revision)
 if err==pgx.ErrNoRows {respond(w,409,map[string]string{"error":"revision conflict; reload before editing"});return}
 if err!=nil {respond(w,503,map[string]string{"error":"could not save draft"});return}
 respond(w,200,map[string]any{"key":key,"draft_revision":revision,"saved":true})
}
func (a API) cmsPublish(w http.ResponseWriter,r *http.Request){
 key:=r.PathValue("key");if !validCMSKey(key){respond(w,400,map[string]string{"error":"invalid page key"});return}
 session,_:=a.session(r)
 ctx,cancel:=context.WithTimeout(r.Context(),5*time.Second);defer cancel()
 tx,err:=a.DB.Begin(ctx);if err!=nil{respond(w,503,map[string]string{"error":"database unavailable"});return};defer tx.Rollback(ctx)
 var id string;var draft json.RawMessage;var rev int
 err=tx.QueryRow(ctx,"SELECT id::text,draft,draft_revision FROM cms_pages WHERE page_key=$1 FOR UPDATE",key).Scan(&id,&draft,&rev)
 if err!=nil{respond(w,404,map[string]string{"error":"draft not found"});return}
 _,err=tx.Exec(ctx,"UPDATE cms_pages SET published=$2,published_revision=$3,published_at=now() WHERE id=$1",id,draft,rev)
 if err==nil {_,err=tx.Exec(ctx,"INSERT INTO cms_page_versions(page_id,revision,snapshot,action,actor_id) VALUES($1,$2,$3,'publish',$4) ON CONFLICT(page_id,revision) DO UPDATE SET snapshot=excluded.snapshot,action='publish',actor_id=excluded.actor_id,created_at=now()",id,rev,draft,session.ID)}
 if err!=nil||tx.Commit(ctx)!=nil{respond(w,503,map[string]string{"error":"publish failed"});return}
 respond(w,200,map[string]any{"published":true,"revision":rev})
}
