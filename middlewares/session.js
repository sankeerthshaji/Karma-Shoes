module.exports = {
    verifyLogin:(req,res,next)=>{
        if(req.session.user){
            next();
        }else{
            res.redirect('/login')
        }
    },

    verifyLoginAdmin:(req,res,next)=>{
        if(req.session.admin){
            next();
        }else{
            res.redirect('/admin/login')
        }
    }
}