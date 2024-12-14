/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import { FACEBOOK_APP_ID, FACEBOOK_GRAPH_API, FACEBOOK_GRAPH_VERSION,require } from "../../Env.js";



export default async function initializeVideoUplaod(access_token) {
    let params=new URLSearchParams({
        file_name:'video.mp4',
        file_length:'5919126',
        file_type:'video/mp4',
        access_token:access_token
    })
    let res=await fetch(`https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}/uploads?`+params.toString(),{
        method :'POST'
    });
    res=await res.json();
    console.log(res)
    if (!res.id) {
        console.log(res);
        throw 'Can not facebook token'
    }
    return res.id
}
