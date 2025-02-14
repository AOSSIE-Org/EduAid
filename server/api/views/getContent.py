from api.utils.imports import *

@csrf_exempt
@api_view(['POST'])
def get_content(request):
    try:
        data = request.data
        document_url = data.get('document_url')
        if not document_url:
            return Response({'error': 'Document URL is required'}), 400

        text = docs_service.get_document_content(document_url)
        return Response(text)
    except ValueError as e:
        return Response({'error': str(e)}), 400
    except Exception as e:
        return Response({'error': str(e)}), 500