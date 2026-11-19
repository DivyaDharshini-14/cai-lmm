<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class LeadController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return LeadResource::collection(Lead::latest('id')->paginate(15));
    }

    public function store(SaveLeadRequest $request): JsonResponse
    {
        $lead = Lead::create($request->leadAttributes());

        return (new LeadResource($lead))->response()
            ->setStatusCode(201)
            ->header('Location', route('api.leads.show', $lead));
    }

    public function show(Lead $lead): LeadResource
    {
        return new LeadResource($lead);
    }

    public function update(SaveLeadRequest $request, Lead $lead): LeadResource
    {
        $lead->update($request->leadAttributes());

        return new LeadResource($lead);
    }

    public function destroy(Lead $lead): Response
    {
        $lead->delete();

        return response()->noContent();
    }
}
