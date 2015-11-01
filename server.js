var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Todo API Root');
});

app.get('/todos', function (req, res) {
  var query = req.query;
  var where = {};

  if (query.hasOwnProperty('completed') && query.completed === 'true') {
    where.completed = true;
  } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
    where.completed = false;
  }

  if (query.hasOwnProperty('q') && query.q.length > 0) {
    where.description = {
      $like: '%' + query.q + '%'
    };
  }

  db.todo.findAll({where: where}).then(function (todos) {
    res.json(todos);
  }, function (error) {
    res.status(500).send();
  });

});

app.get('/todos/:id', function (req, res) {
  var todoId = parseInt(req.params.id, 10);

  db.todo.findById(todoId).then(function (todo) {
    if (!!todo) {
      res.json(todo.toJSON());
    } else {
      res.status(404).send();
    }
  }, function (error) {
    res.status(500).send();
  });

});

app.post('/todos', function (req, res) {
  var newTodo = _.pick(req.body, 'description', 'completed');

  db.todo.create(newTodo).then(function (todo) {
    res.json(todo.toJSON());
  }, function (error) {
    res.status(400).json(error);
  });

});

app.delete('/todos/:id', function (req, res) {
  var todoId = parseInt(req.params.id, 10);

  db.todo.destroy({
    where: {
      id: todoId
    }
  }).then(function (rowsDeleted) {
    if (rowsDeleted === 0) {
      res.status(404).json({
        error: 'No todo with id ' + todoId
      });
    } else {
      res.status(204).send();
    }
  }, function (error) {
    res.status(500).send();
  });
});

app.put('/todos/:id', function (req, res) {
  var todoId = parseInt(req.params.id, 10);
  var newTodo = _.pick(req.body, 'description', 'completed');
  var attributes = {};

  if (newTodo.hasOwnProperty('completed')) {
    attributes.completed = newTodo.completed;
  }

  if (newTodo.hasOwnProperty('description')) {
    attributes.description = newTodo.description
  }

  db.todo.findById(todoId).then(function (todo) {
    if (todo) {
      todo.update(attributes).then(function (todo) {
        res.json(todo.toJSON());
      }, function (error) {
        res.status(404).json(error);
      });
    } else {
      res.status(404).send();
    }
  }, function () {
    res.status(500).send();
  });
});

app.post('/users', function (req, res) {
  var newUser = _.pick(req.body, 'email', 'password');

  db.user.create(newUser).then(function (user) {
    res.json(user.toJSON());
  }, function (error) {
    res.status(400).json(error);
  });
});

db.sequelize.sync().then(function () {
  app.listen(PORT, function () {
    console.log('Express server running on localhost:' + PORT);
  });
});
