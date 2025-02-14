from api.utils.imports import *
import logging

@csrf_exempt
@api_view(['POST'])
def upload_file(request):
    # Log the entire request for debugging
    print("hi 69")
    logging.info(f"Request Data: {request.FILES}")

    if 'file' not in request.FILES:
        return Response({"error": "No file part"}, status=400)

    uploaded_file = request.FILES['file']
    print(request.FILES)
    if uploaded_file.name == '':
        return Response({"error": "No selected file"}, status=400)
    content = file_processor.process_file(uploaded_file)
    if content:
        return Response({"content": content})
    else:
        return Response({"error": "Unsupported file type or error processing file"}, status=400)
