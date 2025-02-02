const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt');


//Post router to add a Person
router.post('/signup',async(req,res)=>{
    try
    {
        const data =req.body;
        const adminUser= await User.findOne({role:'admin'});
        if(data.role=='admin' && adminUser){
            return res.status(400).json({error:"Admin User already exsists"});
        }

        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
        }
        const existingUser = await User.findOne({aadharCardNumber:data.aadharCardNumber});
        if(existingUser){
            return res.status(400).json({error:"User with the same Adhaar card Number already exsists"})
        }

        const newUser=new User(data);
        const response=await newUser.save();
        console.log('Data Saved');

        const payload={
            id:response.id,
        }
        console.log(JSON.stringify(payload))
        const token=generateToken(payload);
        res.status(200).json({response:response,token:token});
    } 
    catch (error)
    {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

//Login Router

router.post('/login',async(req,res)=>{
    try
    {
          const{aadharCardNumber,password}=req.body;
          if(!aadharCardNumber|| !password){
            return res.status(400).json({error:'Aadhar card Number and Password are Required'});
          }

          const user=await User.findOne({aadharCardNumber:aadharCardNumber});
          if(!user || !await user.comparePassword(password)){
            return res.status(401).json({error:'Invalid Aadhar Card Number or Password'});

          }
          const payload={
            id:user.id,
          }
          const token=generateToken(payload);
          res.status(200).json({token});
    } 

    catch (error) 
    {
        console.error(error);
        res.status(500).json({error:"Internal Server Error"});
    }
});

router.get('/profile',jwtAuthMiddleware,async(req,res)=>{
    try 
    {
        const data=req.user.id;
        const response= await  User.findById(data);
        res.status(200).json({response});
    } 
    catch (error) 
    {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
    
});

router.put('/profile/password',jwtAuthMiddleware,async(req,res)=>{
    try
    {
        const userId=req.user.id;
        const{currentPassword,newPassword}=req.body;

        if(!currentPassword || !newPassword){
            return res.status(400).json({error:'Both CurrentPassword and newPassword are required'});
        }
        const user=await User.findById(userId);
        if(!user || !(await user.comparePassword(currentPassword))){
            return res.status(401).json({error:'Invalid Current Password'});
        }

        user.password=newPassword;
        await user.save();
        console.log('Password updated');
        res.status(200).json({message:'Password Updated'});
    } 
    catch (error) 
    {
     
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

module.exports=router
