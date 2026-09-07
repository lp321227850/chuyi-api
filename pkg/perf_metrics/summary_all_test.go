package perfmetrics

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSiteWideSummaryWeightsRequestsInsteadOfAveragingModels(t *testing.T) {
	t.Parallel()

	requests, rate := siteWideSummary(0, 0)
	require.Equal(t, int64(0), requests)
	assert.Nil(t, rate)

	requests, rate = siteWideSummary(10, 8)
	require.Equal(t, int64(10), requests)
	require.NotNil(t, rate)
	assert.InDelta(t, 80.0, *rate, 0.001)

	// 90/100 + 0/10 must be 81.82%, not an unweighted 45%.
	requests, rate = siteWideSummary(110, 90)
	require.Equal(t, int64(110), requests)
	require.NotNil(t, rate)
	assert.InDelta(t, 81.82, *rate, 0.001)
}
