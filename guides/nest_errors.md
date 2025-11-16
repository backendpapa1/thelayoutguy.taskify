Here's a **list of when to use each NestJS HTTP exception**:

## **Client Error Exceptions (4xx)**

### **400 - BadRequestException**
- Invalid data format or structure
- Malformed request body
- Invalid query parameters
- Data validation failures
- Business logic validation errors

### **401 - UnauthorizedException**
- Missing authentication token
- Invalid credentials (login failures)
- Expired or invalid JWT tokens
- Session expired or not found
- User not logged in

### **403 - ForbiddenException**
- User authenticated but lacks required permissions
- Insufficient role or privileges
- Account suspended or banned
- Feature requires subscription/upgrade
- User trying to access someone else's resources

### **404 - NotFoundException**
- Resource not found in database
- Entity with given ID doesn't exist
- Endpoint route doesn't exist
- File or document not found

### **405 - MethodNotAllowedException**
- HTTP method not supported for the endpoint
- Operation not allowed on this resource

### **406 - NotAcceptableException**
- Server can't produce content matching Accept headers
- Requested format not supported

### **408 - RequestTimeoutException**
- Request took too long to process
- Client didn't send data in time

### **409 - ConflictException**
- Duplicate resource (email, username already exists)
- Resource state conflict
- Concurrent modification conflicts
- Version mismatch in updates

### **410 - GoneException**
- Resource permanently deleted
- Deprecated endpoint removed
- Resource intentionally removed

### **412 - PreconditionFailedException**
- If-Match header doesn't match
- Conditional request requirements not met
- Required preconditions not satisfied

### **413 - PayloadTooLargeException**
- Request body exceeds size limit
- File upload too large
- Data payload exceeds maximum

### **415 - UnsupportedMediaTypeException**
- Content-Type not supported
- Invalid file format uploaded
- Unsupported encoding

### **418 - ImATeapotException**
- Easter egg / joke exception
- Testing purposes

### **422 - UnprocessableEntityException**
- Request is well-formed but semantically incorrect
- Business validation failures
- Data violates business rules
- Relationships or dependencies not met

## **Server Error Exceptions (5xx)**

### **500 - InternalServerErrorException**
- Unexpected server errors
- Unhandled exceptions
- Database connection failures
- Third-party service failures

### **501 - NotImplementedException**
- Feature not yet implemented
- Coming soon functionality
- Planned but unavailable endpoints

### **502 - BadGatewayException**
- Invalid response from upstream server
- Proxy or gateway errors
- External API returned invalid response

### **503 - ServiceUnavailableException**
- Server temporarily unavailable
- Maintenance mode
- Service overloaded
- External dependencies down

### **504 - GatewayTimeoutException**
- Upstream server timeout
- External API didn't respond in time
- Proxy timeout

### **505 - HttpVersionNotSupportedException**
- HTTP version not supported by server
- Protocol version mismatch
