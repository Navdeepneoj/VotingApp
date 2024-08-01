const mongoose=require('mongoose');


//define the schema
const CandidateSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    party:{
        type:String,
        require:true
    },
    age:{
        type:Number,
        required:true
    },
    votes:[
        {
            user:{
                type:mongoose.Schema.ObjectId,
                ref:'user',
                require:true
            },
            votedAt:{
                type:Date,
                default:Date.now()
            }
        }
    ],
    votCount:{
        type:Number,
        default:0
    }  
    
})


const Candidate = mongoose.model('Candidate',CandidateSchema);
module.exports=Candidate
