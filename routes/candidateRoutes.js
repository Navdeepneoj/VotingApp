const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware} = require('../jwt');
const Candidate = require('../models/candidate');

const checkAdminRole=async(userId)=>{
    try 
    {
        const user=await User.findById(userId);
        console.log(user);
        if(user.role=='admin'){
            return true;
        }
    } 
    catch (error)
    {
        return false;
    }
}

//Post route to add a candidate
router.post('/',jwtAuthMiddleware,async(req,res)=>{
    try 
    {
        if(!(await checkAdminRole(req.user.id)))
        {
           return res.status(403).json({Message:"user does not have admin role"});
        }

        const data=req.body;
        const newCandidate=new Candidate(data);
        const response= await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response:response});
    } 
    catch (error)
    {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

//change the candidate data only by admin role
router.put('/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    try
    {
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message:'user does not have admin role'});
        }

        const candidateID=req.params.candidateID;
        const updateCandidateData=req.body;

        const response=await Candidate.findByIdAndUpdate(candidateID,updateCandidateData,{
            new:true,
            runValidators:true
        })

        if(!response)
        {
            return res.status(404).json({error:'Candidate not found'});
        }
        console.log('Candidate data updated');
        res.status(200).json(response);
    } 
    catch (error) 
    {
        console.log(error);
        res.status(500).json({error:'Internal Server Error'});
    }
})

//delete candidate by candidate id and only admin can access this
router.delete('/:candidateId',jwtAuthMiddleware,async(req,res)=>{
    try{
        if(!checkAdminRole(req.user.id))
        {
           return res.status(403).json({message:'user does not have admin role'});
        }

        const candidateID=req.params.candidateId;
        const response=await Candidate.findByIdAndDelete(candidateID);
        
        if(!response){
            return res.status(404).json({error:'Candidate not Found'});
        }

        console.log('Candidate Deleted');
        res.status(200).json(response);
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({error:"Internal Server Error"});
    }
})

// Voting
router.get('/vote/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    const candidateID=req.params.candidateID;
    const userId=req.user.id;

    try
    {
      const candidate=await Candidate.findById(candidateID);
      if(!candidate){
        return res.status(404).json({message:'Candidate not found'});
      }
      
      const user=await User.findById(userId);
      if(!user){
        return res.status(404).json({message:'user not found'});
      }
      if(user.role=='admin'){
        return res.status(403).json({message:"admin is not allowed"});
      }
      if(user.isVoted){
        return res.status(400).json({message:"You Have already voted"});
      }

      candidate.votes.push({user:userId});
      candidate.voteCount++;
      await candidate.save();

      user.isVoted=true;
      await user.save();

      return res.status(200).json({message:"votes recored successfully"});
    } 
    catch (error)
    {
        console.log(error);
        return res.status(500).json({error:"Internal Server Error"});
    }
});

router.get('/VoteCount', async (req, res) => {
    try{
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // Map the candidates to only return their name and voteCount
        const voteRecord = candidate.map((data)=>{
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

module.exports=router