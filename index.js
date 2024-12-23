/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import path, { resolve } from 'path';
import { __dirname, FACEBOOK_APP_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_PAGE_ID, FB_USER_ID, IG_ID, REDIRECT_URI, require } from './Env.js'
import express from 'express'
import fetch, { FormData } from 'node-fetch';
import { error, log } from 'console';
import fs from 'fs'
import initializeVideoUplaod from './controlars/fb/initializeVideoUplaod.js';
import { breakJsonData, makeUrlWithParams } from 'string-player';
import Awaiter from 'awaiter.js';
import VideoUploader from './controlars/fb/videoUpload.js';
import Facebook from './Facebook.js';
import catchError, { namedErrorCatching } from './controlars/fb/catchError.js';
import Instagram from './Instagram.js';



const app = express();

app.use(express.static(path.resolve(__dirname, './public')))


let fb=new Facebook({
    client_id :FACEBOOK_APP_ID,
    client_secret :FACEBOOK_CLIENT_SECRET,
    redirect_uri :REDIRECT_URI,
})


app.get('/', (req, res) => res.redirect('/Auth.html'));


app.get("/facebook/login", (req, res) => {
    res.redirect(fb.getAuthUrl());
});

app.get('/facebook/callback', async function (req, res) {
    try {
        let { code } = req.query, writingObject = new Object();

        if (!code) return res.status(400).send("Authorization code missing");


        let access_token = await fb.getAccessToken(code);
        writingObject.user_access_token = access_token;
        
        let user_id=await fb.getUserID(access_token);

        let page=await fb.getPages(user_id,access_token);

        writingObject.user_id=user_id;
        writingObject.page_id=page.id;
        writingObject.page_access_token=page.access_token;
        



        let P = new fb.Page({ pageid: writingObject.page_id, page_accessToken: writingObject.page_access_token });
        writingObject['Instagram_id']=await P.getLinkedInstagramAccounts(); 
        
        log(writingObject);

        fs.writeFileSync(resolve(__dirname,'./fb.json'),breakJsonData(writingObject));
        return res.status(200).send(breakJsonData(writingObject));



    } catch (error) {
        catchError(res,error)
    }

})

app.get('/video', 
    //the idea of publishing video like this to facebook page was taken from stackOverflow
    //that is the reason i have keep the name of function stackOverflowIdeaFacebookPageVideoUpload(){}
    async function (req,res) {
        try {
            let page =new fb.Page({
                page_accessToken :require('./fb.json').page_access_token,
                pageid :require('./fb.json').page_id 
            });
            let id= await page.uploadVideo({
                file_url :'https://gojushinryu.com/video-for-download',
                description :"test video for api practice"
            })
            return res.json({id});
        } catch (error) {
            catchError(res,error)
        }
    }
    
)

app.get('/ig/single/image', async function (req, res) {
    try {

        let ints=new Instagram({
            accessToken :require('./fb.json').user_access_token,
            id:require('./fb.json').Instagram_id
        })

        let creation_id=await ints.uploadSingleImage({
            caption: 'Hello , I am testing instegram api',
            image_url: 'https://gojushinryu.com/img/aboutusarticleImage.jpg'
        })
        
        let post_id=await ints.publishCreation(creation_id);

        return res.json({post_id});
    } catch (error) {
        catchError(res,error);
    }
})


app.get('/ig/images', async function (req, res) {
    try {
        let instagram=new Instagram({
            accessToken :require('./fb.json').user_access_token, id :  require('./fb.json').Instagram_id 
        });
        let post_id= await instagram.createCarusel({
            images: ['https://gojushinryu.com/img/IMG-20240907-WA0006.jpg', 'https://gojushinryu.com/img/IMG-20240907-WA0008.jpg'],
            caption: "testing instagram api"
        });
        res.json({post_id});
        return;
    } catch (error) {
        return catchError(res,error);
    }
})
app.get('/ig/video', async function (req, res) {
    try {
        let ints=new Instagram({
            accessToken :require('./fb.json').user_access_token,
            id:require('./fb.json').Instagram_id
        });
        let creation_id=await ints.uploadReel({video_url:'https://gojushinryu.com/video-for-download',caption:'testing video upload'});
        await ints.checkFinishUploadOrNot(creation_id);
        let post_id=await ints.publishCreation(creation_id);
        return res.json({post_id});
    } catch (error) {
        return catchError(res,error);
    }
 
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
        catchError(res, error);
        
    }
})

app.get('/fb/image', async function (req, res) {
    try {
        let page =new fb.Page({
            page_accessToken :require('./fb.json').page_access_token,
            pageid :require('./fb.json').page_id 
        });
        let url = [
            'https://gojushinryu.com/img/IMG-20240907-WA0006.jpg',
            'https://gojushinryu.com/img/IMG-20240907-WA0008.jpg'
        ];
        let facebookImagesId = [];

        for (let i = 0; (i < url.length && i <=9); i++) {
            let media_fbid=await page.uploadPhoto(url[i]).then(id=> id.media_fbid).catch(error => namedErrorCatching('upload photo error', error));
            facebookImagesId.push({media_fbid});
        }

        let id=await page.postWithImages(facebookImagesId,'testing images upload').catch(e => namedErrorCatching('post-images-error',e));
        
        return res.status(201).json({ id })
    } catch (error) {
        catchError(res,error);
    }
})

app.get('/my-info', async function (req, res) {
    try {
        let response = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${require('./fb.json').user_access_token}`);
        response = await response.json();
        let access_token=response.data[0].access_token,
        page_id=response.data[0].id;
        response=await fetch(`https://graph.facebook.com/v21.0/${page_id}?fields=instagram_business_account&access_token=${access_token}`);
        response=await response.json();
        if (response.instagram_business_account?.id){
            let ig_id=response.instagram_business_account.id;
            log(ig_id);
        }
        else {
            throw 'error , failed to gain intagram ig id'
        }

    } catch (error) {
        catchError(res,error);
    }
})


app.listen(3000)