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
  var queryParams = req.query;
  var filteredTodos = todos;

  if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
    filteredTodos = _.where(filteredTodos, { completed: true })
  } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
    filteredTodos = _.where(filteredTodos, { completed: false })
  }

  if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
    filteredTodos = _.filter(filteredTodos, function (filteredTodo) {
      return filteredTodo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
    });
  }

  res.json(filteredTodos);
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
  var matchedTodo = _.findWhere(todos, { id: todoId });

  if (!matchedTodo) {
    res.status(404).json({"error": "no todo found with that id"});
  } else {
    todos = _.without(todos, matchedTodo);
    res.json(matchedTodo);
  }
});

app.put('/todos/:id', function (req, res) {
  var todoId = parseInt(req.params.id, 10);
  var matchedTodo = _.findWhere(todos, { id: todoId });
  var newTodo = _.pick(req.body, 'description', 'completed');
  var validAttributes = {};

  if (!matchedTodo) {
    return res.status(404).send();
  }

  if (newTodo.hasOwnProperty('completed') && _.isBoolean(newTodo.completed) ) {
    validAttributes.completed = newTodo.completed;
  } else if (newTodo.hasOwnProperty('completed')) {
    return res.status(400).send();
  }

  if (newTodo.hasOwnProperty('description') && _.isString(newTodo.description) && newTodo.description.trim().length > 0) {
    validAttributes.description = newTodo.description
  } else if (newTodo.hasOwnProperty('description')) {
    return res.status(400).send();
  }

  _.extend(matchedTodo, validAttributes);
  res.json(matchedTodo);
});

db.sequelize.sync().then(function () {
  app.listen(PORT, function () {
    console.log('Express server running on localhost:' + PORT);
  });
});
