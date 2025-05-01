module.exports = function resStatus({res,status,dbdata =[],message = ""}){
    let data = {};

    switch (status){
      case 200:
      case 201:
        data.status = "success"
        if(dbdata.length !== 0){
          data.data = dbdata;
        }
        break;
      case 500:
        data.status = "error"
        data.message = message;
        break;
      case 404:
        data.status = "false"
        data.message = message;
        break;
      case 400:
      case 409:
        data.status = "failed"
        data.message = message;
        break;
    }

    res.status(status).json(data);
}