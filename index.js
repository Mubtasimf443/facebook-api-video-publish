/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import path from 'path';
import { __dirname, FACEBOOK_APP_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_PAGE_ID, FB_USER_ID, IG_ID, REDIRECT_URI, require } from './Env.js'
import express from 'express'
import fetch, { FormData } from 'node-fetch';
import { log } from 'console';
import fs from 'fs'
import initializeVideoUplaod from './controlars/fb/initializeVideoUplaod.js';
import { breakJsonData, makeUrlWithParams } from 'string-player';
import Awaiter from 'awaiter.js';
import VideoUploader from './controlars/fb/videoUpload.js';



const app = express();

app.use(express.static(path.resolve(__dirname, './public')))


app.get('/', (req, res) => res.redirect('/Auth.html'));


app.get("/facebook/login", (req, res) => {
    let params = new URLSearchParams()
    let url = makeUrlWithParams(`https://www.facebook.com/v21.0/dialog/oauth`, {
        client_id: FACEBOOK_APP_ID,
        redirect_uri: REDIRECT_URI,
        state: 'csrf_token',
        scope: [
            'publish_video',
            'pages_read_engagement',
            'pages_manage_metadata',
            'pages_manage_posts',
            'pages_show_list',
            'instagram_basic',
            'instagram_content_publish',
            'instagram_manage_insights',
            'read_insights',
            'business_management',
            'pages_read_user_content'
        ].join(',')
    });
    res.redirect(url);
});

async function getUserId(access_token) {
    if (!access_token) throw 'access token is undefined on getUserId function'
    let response=await fetch(`https://graph.facebook.com/me?access_token=${access_token}`);
    response=await response.json();
    console.log(response);
    if (response.error || !response.id) throw (response.error ? response.error :response);
    return response.id;
}
async function getPageAccessToken(user_id,access_token) {
    if (!access_token) throw 'access token is undefined on getUserId function'
    if (!user_id) throw 'user id is undefined on getUserId function'
    let response=await fetch(`https://graph.facebook.com/v21.0/${user_id}/accounts?access_token=${access_token}`);
    response=await response.json();
    log(response)
    if (response.error || !response.data) throw (response.error ? response.error : response);
    if (response.data.length===0 || !response.data[0].access_token  ) throw 'User has No Page , please create a page'
    if (response.data[0].access_token) return response.data[0].access_token
}
app.get('/facebook/callback', async function (req, res) {
    try {
        let { code } = req.query,
        writingObject={
            user_access_token :undefined,
            page_access_token:undefined,
            expires_in:undefined,
            user_id :undefined
        };
        if (!code) return res.status(400).send("Authorization code missing");
        let params = new URLSearchParams({
            client_id: FACEBOOK_APP_ID,
            redirect_uri: REDIRECT_URI,
            client_secret: FACEBOOK_CLIENT_SECRET,
            code,
        });
        let response = await fetch('https://graph.facebook.com/v21.0/oauth/access_token?' + params.toString(), {});
        response = await response.json();
        log('// first step')
        console.log(response)
        if (response.error || !response.access_token) throw (response.error ? response.error :response);
        if ( response.access_token)  {
            writingObject.user_access_token = response.access_token;
            writingObject.expires_in=response.expires_in;
        }
        if (writingObject.user_access_token) {
            log('// second step')
            writingObject.user_id=await getUserId(writingObject.user_access_token);
            log('// third step')
            writingObject.page_access_token=await getPageAccessToken(writingObject.user_id , writingObject.user_access_token);
            let data=JSON.stringify(writingObject);
            data=breakJsonData(data)
            fs.writeFileSync(path.resolve(__dirname,'./fb.json'),data);
            return res.redirect('/account.html');
        }
    } catch (error) {
        console.error(error);
        if (typeof error === 'string') {
            return res.json({
                hasError: true,
                error: {
                    massage: error
                }
            })
        }
        return res.json({
            hasError: true,
            error: error
        })
    }

})



app.get('/video', 
    //the idea of publishing video like this to facebook page was taken from stackOverflow
    //that is the reason i have keep the name of function stackOverflowIdeaFacebookPageVideoUpload(){}
    async function stackOverflowIdeaFacebookPageVideoUpload(req,res) {
        let access_token=require('./fb.json').page_access_token;
        let params=(new URLSearchParams({
            access_token,
            file_url :'https://gojushinryu.com/video-for-download',
            description :'Insha Allah , bY the marcy of Allah ,video will be published',
            published:true
        })).toString();
        let response=await fetch(`https://graph.Facebook.com/v21.0/me/videos?${params}`,{method:'POST'});
        response=await response.json();
        return res.json(response)
    }
)

app.get('/ig/single/image', async function (req, res) {
    try {
        let params = new URLSearchParams({
            image_url: 'https://gojushinryu.com/img/about_us_article_image.jpg',
            caption: 'Hello , I am testing instegram api',
            access_token: require('./fb.json').access_token
        })
        let response = await fetch(`https://graph.facebook.com/v21.0/${IG_ID}/media?${params.toString()}`, { method: 'POST' });
        response = await response.json();
        log(response)
        if (response.id) {
            params = new URLSearchParams({
                creation_id: response.id,
                access_token: require('./fb.json').access_token
            })
            let newResponse = await fetch(`https://graph.facebook.com/v21.0/${IG_ID}/media_publish?${params.toString()}`, { method: 'POST' });
            newResponse = await newResponse.json();
            console.log('newResponse')
            console.log(newResponse)
        }
    } catch (error) {
        console.error(error)
    }
})
app.get('/ig/images', async function (req, res) {
    try {
        let caption = 'This a test carusel content upload'
        let array = [
            'https://gojushinryu.com/img/IMG-20240907-WA0006.jpg',
            'https://gojushinryu.com/img/IMG-20240907-WA0008.jpg'
        ];
        let carousel_contents = [];
        for (let i = 0; i < array.length; i++) {
            let params = new URLSearchParams({
                is_carousel_item: true,
                image_url: array[i],
                access_token: require('./fb.json').access_token
            })
            let response = await fetch(`https://graph.facebook.com/v21.0/${IG_ID}/media?${params.toString()}`, { method: 'POST' });
            response = await response.json();
            console.log(response);
            if (response.error) throw response.error
            if (response.id) carousel_contents.push(response.id)
        }
        let params = new URLSearchParams({
            caption,
            media_type: "CAROUSEL",
            children: carousel_contents,
            access_token: require('./fb.json').access_token,

        });
        let requestUrl = `https://graph.facebook.com/v21.0/${IG_ID}/media?${params.toString()}`;
        console.log({ requestUrl })
        let response = await fetch(requestUrl, { method: 'POST' });
        response = await response.json();
        console.log(response);
        if (response.error) throw response.error
        let creation_id = response.id;
        if (creation_id) {
            let params = new URLSearchParams({
                creation_id: creation_id,
                access_token: require('./fb.json').access_token
            });
            let response = await fetch(`https://graph.facebook.com/v21.0/${IG_ID}/media_publish?${params.toString()}`, { method: 'POST' });
            response = await response.json();
            console.log(response);
            if (response.error) throw response.error
            if (response.id) {
                return res.status(201).json({
                    success: true,
                    publish_id: response.id
                })
            }
        }
        if (!creation_id) throw 'error in caruser publish'
    } catch (error) {
        console.error(error);
        if (typeof error === 'string') {
            return res.json({
                hasError: true,
                error: {
                    massage: error
                }
            })
        }
        return res.json({
            hasError: true,
            error: error
        })
    }
})
app.get('/ig/video', async function (req, res) {
    try {
        let params = (new URLSearchParams({
            video_url: 'https://gojushinryu.com/video-for-download',
            media_type: 'REELS',
            caption: 'Testing video upload',
            access_token: require('./fb.json').access_token
        })).toString();
        let response = await fetch(`https://graph.facebook.com/v21.0/${IG_ID}/media?${params}`, { method: 'POST' });
        response = await response.json();
        console.log(response)
        if (response.error) throw response.error
        let containerID = response.id;

        async function checkFinishReelsUpload(containerID) {
            let params = (new URLSearchParams({
                fields: 'status_code',
                access_token: require('./fb.json').access_token
            })).toString();
            let response = await fetch(`https://graph.facebook.com/v21.0/${containerID}?${params}`);
            response = await response.json();
            console.log(response);
            if (response.error) throw response.error
            if (response.status_code !== "FINISHED") return false;
            if (response.status_code === "FINISHED") return true;
        }

        if (containerID) {
            for (let index = 0; index < 30; index++) {
                let status = await checkFinishReelsUpload(containerID);
                if (status) {
                    index = 31;
                }
                if (!status) {
                    await Awaiter(3000);
                }
            };
            let params = (new URLSearchParams({
                creation_id: containerID,
                access_token: require('./fb.json').access_token
            })).toString()
            let response = await fetch(`https://graph.facebook.com/v21.0/${IG_ID}/media_publish?${params}`, { method: 'POST' });
            response = await response.json();
            console.log({
                ...response
            });

            if (response.error) throw response.error
            if (!response.id) throw response
            return res.status(201).json({
                success: true,
                publish_id: response.id
            });
        }

    } catch (error) {
        console.error(error);
        if (typeof error === 'string') {
            return res.json({
                hasError: true,
                error: {
                    massage: error
                }
            })
        }
        return res.json({
            hasError: true,
            error: error
        })
    }
})

app.get('/fb/image', async function (req, res) {
    try {
        let url = [
            'https://gojushinryu.com/img/IMG-20240907-WA0006.jpg',
            'https://gojushinryu.com/img/IMG-20240907-WA0008.jpg'
        ];
        let access_token=require('./fb.json').page_access_token;
        let facebookImagesId = [];
        for (let i = 0; (i < url.length && i <=9); i++) {
            let params=(new URLSearchParams({
                published: false,
                url: url[i],
                access_token 
            })).toString()
            let response = await fetch('https://graph.facebook.com/v21.0/' + FACEBOOK_PAGE_ID + '/photos?'+params, { method: 'POST' });
            response = await response.json();
            console.log(response)
            if (response.error) throw response.error
            if (!response.id) throw response
            facebookImagesId.push({ media_fbid: response.id });
        }
        if (facebookImagesId.length === 0) throw 'No image was updated'
        let response = await fetch('https://graph.facebook.com/v21.0/' + FACEBOOK_PAGE_ID + '/feed', {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({
                published: true,
                message: 'Test a api',
                attached_media: facebookImagesId,
                access_token
            })
        });
        response = await response.json();
        return res.status(201).json({ ...response })
    } catch (error) {
        console.error(error);
        if (typeof error === 'string') {
            return res.json({
                hasError: true,
                error: {
                    massage: error
                }
            })
        }
        return res.json({
            hasError: true,
            error: error
        })
    }
})


app.listen(3000)