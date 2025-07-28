class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.stutusCode=statusCode
        this.data=data
        this.message=message 
        this.success=statusCode < 400
    } 
}

//Status codes
// Informational responses(100-199)
// successful responses(200-299)
// Redirection message(300-399)
// Client error responses(400-499)
// server error responses(500-599)

export {ApiResponse}