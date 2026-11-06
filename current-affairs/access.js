import { supabase } from "../kagzi-supabase.js";
export async function getCurrentAffairsAccess(){
 const {data,error}=await supabase.from("kagzi_current_affairs_access").select("section,access_tier");
 if(error) throw error;
 return Object.fromEntries((data||[]).map(x=>[x.section,x.access_tier]));
}
