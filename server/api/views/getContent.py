from api.utils.imports import *

@csrf_exempt
@api_view(['POST'])
def get_content(request):
    try:
        data = request.data
        document_url = data.get('document_url')
        
        # Validate the document_url parameter
        if not document_url:
            return Response({'error': 'Document URL is required'}, status=400)
        
        # Assuming docs_service.get_document_content fetches the document content
        text = docs_service.get_document_content(document_url)
        
        # Return the fetched content
        return Response({'content': text})
    
    except ValueError as e:
        return Response({'error': str(e)}, status=400)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)