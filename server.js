var express = require('express')
  bodyParser = require('body-parser')
  mongoose = require('mongoose')
  cors = require('cors')
  morgan = require('morgan')
  jwt = require('jsonwebtoken');
  errorHandler = require('./modules/handleError')
  checkToken = require('./middlewares/check-token')
  config = require('./config/config');

var app = express();

//Set secret which will be used for generate tokens
app.set('superSecret', config.secret);

//eror handler module which has to be used with every api error
var errHandler = new errorHandler();

// configure app to use bodyParser()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Enable CORS support
app.use(cors());
app.use("/api", checkToken);

//Set listening port
var port = process.env.PORT || 4201;

//Initialize router with modularized way as we need to do all api requests via /api/xxxx
var router = express.Router();
var nonAuthRouter = express.Router();

var uri = "mongodb://srimal:srimal123@ds147520.mlab.com:47520/tododata";
mongoose.connect(uri);

// Start the HTTP server once the app successfully connected to the Mongo DB
mongoose.connection.on('connected', function () {  
  console.log('Mongoose default connection open to ' + uri);

  app.listen(port);
  console.log('Node HTTP server started on port: ' + port);

}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
});

//Initialize morgan request logging service
app.use(morgan("dev"));

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

//Import todo model
var Todo = require('./models/todo');

router.route('/todo')
	
    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {
        
      // create a new instance of the Todo model
	    var todo = new Todo(); 

      todo.name = req.body.name;
      todo.id = req.body.id;
      todo.completed = req.body.completed;
      todo.description = req.body.description;

      // save the todo and check for errors
      todo.save(function(err, data) {
          if (err){
            errHandler.handleError(res, err, "Error on update data", 500);
          }
          res.status(200).json(data);
      });
    })

    .get(function(req, res) {

      // save the todo and check for errors
      Todo.find(function(err, data) {
          if (err){
            errHandler.handleError(res, err, "Error on retrive data", 500);
          }
          res.json(data);
      });
    });

    router.route('/todo/:id')
    .get(function(req, res){
    	Todo.findById(req.params.id, function(err, todo){
    		if (err){
          errHandler.handleError(res, err, "Error on get data", 500);
        }
    		res.json(todo);
    	})
    })
    .put(function(req, res){
    	Todo.findById(req.params.id, function(err, oldTodo){
        if (err){
          errHandler.handleError(res, err, "Error on find data", 500);
        }

    		oldTodo.name = req.body.name;
    		oldTodo.description = req.body.description;
    		oldTodo.completed = req.body.completed;

    		oldTodo.save(function(err, update_info){
    			if(err){res.send(err)}
    			res.status(200).json(update_info);
    		})
    	});
    })
    .delete(function(req, res){
    	Todo.findByIdAndRemove(req.params.id, function(err, result){
        if (err){
          errHandler.handleError(res, err, "Error on delete records", 500);
        }
    		res.status(200).json(result);
    	})
    });

var User = require('./models/user');

nonAuthRouter.route('/signin')
  .post(function(req, res){
    if(!req.body){
      res.sendStatus(400);
    }

    User.findOne({"username": req.body.username, "password": req.body.password}, function(err, user){
      if(err){
        res.status(500).json({"success": false, "message": err});
      }
      else{
        if(user){
        
          // if user is found and password is right
          // create a token
          var token = jwt.sign(user, app.get('superSecret'), {
            expiresIn: 60*60 // expires in 24 hours
          });

          res.status(200).json({"success":true, "token":token, "user": user});
        }else{
          res.status(200).json({"success": false, "message":"Authentication error"});
        }
      }
    })
  });

router.route('/user')
  .post(function(req, res){
    if(!req.body){
      res.status(400).json({"success":false, "message":"Invalid request"});
      res.end();
    }

    var user = new User();
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;

    user.save(function(err, data){
      if(err){
        errHandler.handleError(res, err, "Error on update data", 500);
      }
      if(data){
        res.status(200).json(data);
      }
    })
  })

// all of our routes will be prefixed with /api
app.use('/api', router);
app.use('/auth', nonAuthRouter);