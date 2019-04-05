const express = require('express');
const AWS = require('aws-sdk');
const todo = require('./libs/todo');
const app = express();

// Sample Data
const todoList = [
    {id: 1, title: "Create Node.js sample application", description: "hogehoge", optional: false},
    {id: 2, title: "Create test code Node.js sample", description: "hogehoge", optional: true},
    {id: 3, title: "Create Docker container with Node.js", description: "hogehoge", optional: false},
    {id: 4, title: "Create docker-compose with localStack", description: "hogehoge", optional: false},
    {id: 5, title: "Create CodeBuild, Code Pipeline", description: "hogehoge", optional: false}
];
// API的なやつ
app.get('/v1/todo', (req, res) => {
    console.log(todo.countOptionals(todoList));
    res.json(todoList)
});
app.get('/v1/todo/:id', (req, res) => {
	const id = req.params.id;
	if (id === undefined || isNaN(id)) {
		res.status(400).json({ error: 'param is invalid. id is '+id });
		return
	}
	const todoItem = todoList.filter(item => item.id == id).shift();
	if (todoItem === undefined) {
		res.status(404).json({ error: 'not found todo item. id is '+id });
		return
	}
    console.log(todoItem);
    res.json(todoItem)
});

// AWS S3
// TODO endpointのhost名は環境によって使い分ける必要あり
AWS.config.update({
    accessKeyId: "your access key id",
    secretAccessKey: "your secret access key",
    s3: { endpoint: "http://<<your container name>>:4572" },
    s3ForcePathStyle: true
});
const s3 = new AWS.S3();
const bucketName = 'localstack-sample';
const objectKey = 'localstack-key';

app.post('/v1/memo', (req, res) => {
    const message = 'Sample localstack with Node.js';

    s3.createBucket( { Bucket: bucketName }, (err, data) => {
        if (err !== null) {
            console.log(err);
            return
        }
        s3.putObject( { Bucket: bucketName, Key: objectKey, Body: message }, (err, data) => {
            if (err !== null) {
                console.log(err);
                return
            }
            s3.getObject( { Bucket: bucketName, Key: objectKey }, (err, data) => {
                if (err !== null || data === null) {
                    console.log(err);
                    return
                } else {
                    const result = {result: data.Body.toString()};
                    res.json(result)
                }
            })
        })
    })
});

app.get('/v1/memo', (req, res) => {
    s3.getObject( { Bucket: bucketName, Key: objectKey }, (err, data) => {
        if (err !== null || data === null) {
            console.log(err)
        } else {
            const result = {result: data.Body.toString()};
            res.json(result)
        }
    })
});

app.listen(3000, () => console.log("bootstrap nodejs server. listen port 3000"));
